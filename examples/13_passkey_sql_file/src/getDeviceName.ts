export default async function getDeviceName() {
    // Try modern Client Hints API first
    if ((navigator as any).userAgentData) {
        try {
            const hints = await (navigator as any).userAgentData.getHighEntropyValues([
            'platform', 
            'platformVersion', 
            'model'
            ]);
            
            const platform = hints.platform || 'Unknown Device';
            const browser = (navigator as any)
                .userAgentData.brands?.find((b: any) => !['Chromium', 'Not A(Brand', 'Not(A:Brand'].some(x => b.brand.includes(x))) ?.brand || '';
            
            // For mobile devices, include model if available
            if ((navigator as any).userAgentData.mobile && hints.model) {
            return browser ? `${hints.model} (${browser})` : hints.model;
            }
            
            return browser ? `${platform} (${browser})` : platform;
        } catch (e) {
            // Fall through to User-Agent parsing
        }
    }

    // Fallback: User-Agent parsing
    const ua = navigator.userAgent;

    let platform = 'Unknown Device';
    if (/iPhone/.test(ua)) platform = 'iPhone';
    else if (/iPad/.test(ua)) platform = 'iPad';
    else if (/Android/.test(ua)) platform = 'Android';
    else if (/Macintosh/.test(ua)) platform = 'Mac';
    else if (/Windows/.test(ua)) platform = 'Windows PC';
    else if (/Linux/.test(ua)) platform = 'Linux';

    let browser = '';
    if (/Edg/.test(ua)) browser = 'Edge';
    else if (/Chrome/.test(ua)) browser = 'Chrome';
    else if (/Safari/.test(ua)) browser = 'Safari';
    else if (/Firefox/.test(ua)) browser = 'Firefox';

    return browser ? `${platform} (${browser})` : platform;
}

