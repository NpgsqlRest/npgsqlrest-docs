// Needs to match server config
const config = {
    registrationOptionsPath: '/api/passkey/register/options',
    registrationPath: '/api/passkey/register',
    loginOptionsPath: '/api/passkey/login/options',
    loginPath: '/api/passkey/login',
    addPasskeyOptionsPath: '/api/passkey/add/options',
    addPasskeyPath: '/api/passkey/add',
};

type PasskeyErrorCodeType =
    // Server error codes
    | 'invalid_request'
    | 'authentication_required'
    | 'challenge_invalid'
    | 'attestation_invalid'
    | 'assertion_invalid'
    | 'database_error'
    | 'store_failed'
    | 'authentication_failed'
    // Client-side error codes
    | 'webauthn_not_supported'
    | 'cancelled'
    | 'already_registered'
    | 'unknown';

interface PasskeyError {
    code: PasskeyErrorCodeType;
    message: string;
}

interface RegistrationOptions {
    userName: string;
    displayName: string;
    deviceName?: string;
    [key: string]: any;
}

interface AddPasskeyOptions {
    deviceName?: string;
    [key: string]: any;
}

export interface RegistrationResult {
    success: boolean;
    credentialId?: string;
    error?: PasskeyError;
}

interface LoginOptions {
    userName?: string;
    [key: string]: any;
}

export interface LoginResult {
    success: boolean;
    response: string;
    error?: PasskeyError;
}

async function extractError(response: Response, fallback: string): Promise<PasskeyError> {
    const text = await response.text();
    try {
        const json = JSON.parse(text);
        // Handle RFC 7807 Problem Details format (type, status, title, detail)
        // Also supports legacy format (error, errorDescription) for backwards compatibility
        return {
            code: json.type || json.error || 'unknown',
            message: json.title || json.detail || json.errorDescription || fallback
        };
    } catch {
        return {
            code: 'unknown',
            message: text || fallback
        };
    }
}

function createError(code: PasskeyErrorCodeType, message: string): PasskeyError {
    return { code, message };
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
        base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function isWebAuthnSupported(): boolean {
    return !!(
        window.PublicKeyCredential &&
        typeof window.PublicKeyCredential === 'function'
    );
}

export async function isConditionalMediationAvailable(): Promise<boolean> {
    if (!isWebAuthnSupported()) return false;
    try {
        return await PublicKeyCredential.isConditionalMediationAvailable?.() ?? false;
    } catch {
        return false;
    }
}

export async function register(
    options: RegistrationOptions,
    analyticsData?: object
): Promise<RegistrationResult> {
    if (!isWebAuthnSupported()) {
        return {
            success: false,
            error: createError('webauthn_not_supported', 'WebAuthn is not supported in this browser')
        };
    }

    try {
        const optionsResponse = await fetch(config.registrationOptionsPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(options)
        });

        if (!optionsResponse.ok) {
            return { success: false, error: await extractError(optionsResponse, 'Failed to get registration options') };
        }

        const creationOptions = await optionsResponse.json();

        const publicKeyOptions: PublicKeyCredentialCreationOptions = {
            challenge: base64UrlToBuffer(creationOptions.challenge),
            rp: {
                id: creationOptions.rp.id,
                name: creationOptions.rp.name
            },
            user: {
                id: base64UrlToBuffer(creationOptions.user.id),
                name: creationOptions.user.name,
                displayName: creationOptions.user.displayName
            },
            pubKeyCredParams: creationOptions.pubKeyCredParams,
            timeout: creationOptions.timeout,
            attestation: creationOptions.attestation as AttestationConveyancePreference,
            authenticatorSelection: creationOptions.authenticatorSelection ? {
                residentKey: creationOptions.authenticatorSelection.residentKey as ResidentKeyRequirement,
                userVerification: creationOptions.authenticatorSelection.userVerification as UserVerificationRequirement,
                authenticatorAttachment: creationOptions.authenticatorSelection.authenticatorAttachment as AuthenticatorAttachment
            } : undefined,
            excludeCredentials: creationOptions.excludeCredentials?.map((cred: any) => ({
                type: cred.type as PublicKeyCredentialType,
                id: base64UrlToBuffer(cred.id),
                transports: cred.transports as AuthenticatorTransport[]
            }))
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions
        }) as PublicKeyCredential;

        if (!credential) {
            return {
                success: false,
                error: createError('unknown', 'Failed to create credential')
            };
        }

        const attestationResponse = credential.response as AuthenticatorAttestationResponse;

        const registerResponse = await fetch(config.registrationPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                challengeId: creationOptions.challengeId,
                credentialId: bufferToBase64Url(credential.rawId),
                attestationObject: bufferToBase64Url(attestationResponse.attestationObject),
                clientDataJSON: bufferToBase64Url(attestationResponse.clientDataJSON),
                transports: attestationResponse.getTransports?.() || [],
                userContext: creationOptions.userContext,
                analyticsData: analyticsData ? JSON.stringify(analyticsData) : undefined
            })
        });

        if (!registerResponse.ok) {
            return { success: false, error: await extractError(registerResponse, 'Registration failed') };
        }

        const result = await registerResponse.json();
        return { success: true, credentialId: result.credentialId };

    } catch (error: any) {
        if (error.name === 'NotAllowedError') {
            return {
                success: false,
                error: createError('cancelled', 'Registration was cancelled or timed out')
            };
        }
        if (error.name === 'InvalidStateError') {
            return {
                success: false,
                error: createError('already_registered', 'This authenticator is already registered')
            };
        }
        return {
            success: false,
            error: createError('unknown', error.message || 'Unknown error during registration')
        };
    }
}

export async function login(
    options: LoginOptions = {},
    analyticsData?: object
): Promise<LoginResult> {
    if (!isWebAuthnSupported()) {
        return {
            success: false,
            response: '',
            error: createError('webauthn_not_supported', 'WebAuthn is not supported in this browser')
        };
    }

    try {
        const optionsResponse = await fetch(config.loginOptionsPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: options.userName || null
            })
        });

        if (!optionsResponse.ok) {
            return { success: false, response: '', error: await extractError(optionsResponse, 'Failed to get login options') };
        }

        const requestOptions = await optionsResponse.json();

        const publicKeyOptions: PublicKeyCredentialRequestOptions = {
            challenge: base64UrlToBuffer(requestOptions.challenge),
            rpId: requestOptions.rpId,
            timeout: requestOptions.timeout,
            userVerification: requestOptions.userVerification as UserVerificationRequirement,
            allowCredentials: requestOptions.allowCredentials?.length > 0
                ? requestOptions.allowCredentials.map((cred: any) => ({
                    type: cred.type as PublicKeyCredentialType,
                    id: base64UrlToBuffer(cred.id),
                    transports: cred.transports as AuthenticatorTransport[]
                }))
                : undefined
        };

        const credential = await navigator.credentials.get({
            publicKey: publicKeyOptions
        }) as PublicKeyCredential;

        if (!credential) {
            return {
                success: false,
                response: '',
                error: createError('unknown', 'Failed to get credential')
            };
        }

        const assertionResponse = credential.response as AuthenticatorAssertionResponse;

        const loginResponse = await fetch(config.loginPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                challengeId: requestOptions.challengeId,
                credentialId: bufferToBase64Url(credential.rawId),
                authenticatorData: bufferToBase64Url(assertionResponse.authenticatorData),
                clientDataJSON: bufferToBase64Url(assertionResponse.clientDataJSON),
                signature: bufferToBase64Url(assertionResponse.signature),
                userHandle: assertionResponse.userHandle
                    ? bufferToBase64Url(assertionResponse.userHandle)
                    : undefined,
                analyticsData: analyticsData ? JSON.stringify(analyticsData) : undefined
            })
        });

        if (!loginResponse.ok) {
            return { success: false, response: '', error: await extractError(loginResponse, 'Login failed') };
        }

        return { success: true, response: await loginResponse.text() };

    } catch (error: any) {
        if (error.name === 'NotAllowedError') {
            return {
                success: false,
                response: '',
                error: createError('cancelled', 'Login was cancelled or timed out')
            };
        }
        return {
            success: false,
            response: '',
            error: createError('unknown', error.message || 'Unknown error during login')
        };
    }
}

export async function addPasskey(
    options: AddPasskeyOptions = {},
    analyticsData?: object
): Promise<RegistrationResult> {
    if (!isWebAuthnSupported()) {
        return {
            success: false,
            error: createError('webauthn_not_supported', 'WebAuthn is not supported in this browser')
        };
    }

    try {
        const optionsResponse = await fetch(config.addPasskeyOptionsPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(options)
        });

        if (!optionsResponse.ok) {
            return { success: false, error: await extractError(optionsResponse, 'Failed to get registration options') };
        }

        const creationOptions = await optionsResponse.json();

        const publicKeyOptions: PublicKeyCredentialCreationOptions = {
            challenge: base64UrlToBuffer(creationOptions.challenge),
            rp: {
                id: creationOptions.rp.id,
                name: creationOptions.rp.name
            },
            user: {
                id: base64UrlToBuffer(creationOptions.user.id),
                name: creationOptions.user.name,
                displayName: creationOptions.user.displayName
            },
            pubKeyCredParams: creationOptions.pubKeyCredParams,
            timeout: creationOptions.timeout,
            attestation: creationOptions.attestation as AttestationConveyancePreference,
            authenticatorSelection: creationOptions.authenticatorSelection ? {
                residentKey: creationOptions.authenticatorSelection.residentKey as ResidentKeyRequirement,
                userVerification: creationOptions.authenticatorSelection.userVerification as UserVerificationRequirement,
                authenticatorAttachment: creationOptions.authenticatorSelection.authenticatorAttachment as AuthenticatorAttachment
            } : undefined,
            excludeCredentials: creationOptions.excludeCredentials?.map((cred: any) => ({
                type: cred.type as PublicKeyCredentialType,
                id: base64UrlToBuffer(cred.id),
                transports: cred.transports as AuthenticatorTransport[]
            }))
        };

        const credential = await navigator.credentials.create({
            publicKey: publicKeyOptions
        }) as PublicKeyCredential;

        if (!credential) {
            return {
                success: false,
                error: createError('unknown', 'Failed to create credential')
            };
        }

        const attestationResponse = credential.response as AuthenticatorAttestationResponse;

        const addPasskeyResponse = await fetch(config.addPasskeyPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                challengeId: creationOptions.challengeId,
                credentialId: bufferToBase64Url(credential.rawId),
                attestationObject: bufferToBase64Url(attestationResponse.attestationObject),
                clientDataJSON: bufferToBase64Url(attestationResponse.clientDataJSON),
                transports: attestationResponse.getTransports?.() || [],
                userContext: creationOptions.userContext,
                analyticsData: analyticsData ? JSON.stringify(analyticsData) : undefined
            })
        });

        if (!addPasskeyResponse.ok) {
            return { success: false, error: await extractError(addPasskeyResponse, 'Failed to add passkey') };
        }

        const result = await addPasskeyResponse.json();
        return { success: true, credentialId: result.credentialId };

    } catch (error: any) {
        if (error.name === 'NotAllowedError') {
            return {
                success: false,
                error: createError('cancelled', 'Registration was cancelled or timed out')
            };
        }
        if (error.name === 'InvalidStateError') {
            return {
                success: false,
                error: createError('already_registered', 'This authenticator is already registered')
            };
        }
        return {
            success: false,
            error: createError('unknown', error.message || 'Unknown error adding passkey')
        };
    }
}
