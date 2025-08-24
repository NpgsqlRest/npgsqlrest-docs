---
outline: [2, 3]
title: "Installation Guide"
titleTemplate: NpgsqlRest
description: "Install NpgsqlRest on Windows, Linux, or macOS. Download pre-built executables, use Docker, or build from source. Get your PostgreSQL REST API server running."
head:
  - - meta
    - name: keywords
      content: npgsqlrest install, postgresql rest api server install, npgsqlrest docker, npgsqlrest linux, npgsqlrest windows, npgsqlrest macos
  - - meta
    - property: og:title
      content: "NpgsqlRest Installation Guide"
  - - meta
    - property: og:description
      content: "Install NpgsqlRest on Windows, Linux, or macOS. Download executables, use Docker, or build from source."
  - - meta
    - property: og:type
      content: article
---

# NpgsqlRest Installation Guide

## Download Executable

### Manual Installation

You can always manually download the latest version executable from the official [Release page](https://github.com/NpgsqlRest/NpgsqlRest/releases/latest).

Release page downloads include builds for:
- [Win64 Systems](https://github.com/NpgsqlRest/NpgsqlRest/releases/latest/download/npgsqlrest-win64.exe)
- [Linux64 Systems](https://github.com/NpgsqlRest/NpgsqlRest/releases/latest/download/npgsqlrest-linux64)
- [Linux ARM64 Systems](https://github.com/NpgsqlRest/NpgsqlRest/releases/latest/download/npgsqlrest-linux-arm64) - For Raspberry Pi, AWS Graviton, Apple Silicon Linux VMs, etc.
- [MacOS ARM64 Systems](https://github.com/NpgsqlRest/NpgsqlRest/releases/latest/download/npgsqlrest-osx-arm64)

The optional [default configuration](https://github.com/NpgsqlRest/NpgsqlRest/releases/latest/download/appsettings.json) file is also included, but this is just for convenience; it works with the same default values without this configuration file.

Additional builds (e.g., MacOS x64) may be added in the future.


### Command Line Download

#### Windows (x64)
```powershell
# Download using PowerShell
Invoke-WebRequest -Uri "https://github.com/NpgsqlRest/NpgsqlRest/releases/latest/download/npgsqlrest-win64.exe" -OutFile "npgsqlrest.exe"

# Optionally add to PATH or move to desired location
```

#### Linux (x64)
```bash
# Download the executable
wget https://github.com/NpgsqlRest/NpgsqlRest/releases/latest/download/npgsqlrest-linux64 -O npgsqlrest

# Make it executable
chmod +x npgsqlrest

# Optionally move to the system path
sudo mv npgsqlrest /usr/local/bin/
```

#### Linux (ARM64)
```bash
# Download the ARM64 executable (for Raspberry Pi, AWS Graviton, etc.)
wget https://github.com/NpgsqlRest/NpgsqlRest/releases/latest/download/npgsqlrest-linux-arm64 -O npgsqlrest

# Make it executable
chmod +x npgsqlrest

# Optionally move to the system path
sudo mv npgsqlrest /usr/local/bin/
```

#### macOS (ARM64)
```bash
# Download the executable
curl -L https://github.com/NpgsqlRest/NpgsqlRest/releases/latest/download/npgsqlrest-osx-arm64 -o npgsqlrest

# Make it executable
chmod +x npgsqlrest

# Optionally move to the system path
sudo mv npgsqlrest /usr/local/bin/
```

### Command Line Basic Commands

You can run some basic commands to test your installation. Assuming that the binary name is `npgsqlrest`, you can

- Check versions. This includes the client version and all included components:

```bash
# Show versions
npgsqlrest --version
npgsqlrest -v
```

- See some help information:

```bash
# Show help
npgsqlrest --help
npgsqlrest -h
```

- Inspect configuration with syntax highlighting:

```bash
# Show current configuration (syntax highlighted in terminal, plain JSON when piped)
npgsqlrest --config
```

- Validate configuration and database connectivity:

```bash
# Pre-flight check (exits with code 0 on success, 1 on failure)
npgsqlrest --validate
```

- List all supported SQL comment annotations:

```bash
# All supported annotations as a JSON array
npgsqlrest --annotations
```

## NPM Installation

```bash
# Install globally
npm install -g npgsqlrest

# Or install locally in the project
npm install npgsqlrest
```

To check versions or see help information, use the NPX runner:

```bash
# Show versions
npx npgsqlrest --version
npx npgsqlrest -v

# Show help
npx npgsqlrest --help
npx npgsqlrest -h
```

**Note**: The NPM package automatically downloads the appropriate executable for your operating system during installation.

## Docker Installation

### Standard Image (AOT)

```bash
# Pull the latest image (optional, docker run will do this if the image is not pulled)
docker pull vbilopav/npgsqlrest:latest

# Check versions for all components
docker run --name npgsqlrest -it vbilopav/npgsqlrest:latest --version

# See help
docker run --name npgsqlrest -it vbilopav/npgsqlrest:latest --help

# Run with configuration file and with default port exposed
docker run --name npgsqlrest -it -p 8080:8080 -v ./appsettings.json:/app/appsettings.json vbilopav/npgsqlrest:latest
```

### JIT Image

A Docker image variant using .NET runtime with JIT (Just-In-Time) compilation instead of AOT:

```bash
# Pull the JIT image variant
docker pull vbilopav/npgsqlrest:latest-jit

# Run with JIT runtime
docker run --name npgsqlrest-jit -it -p 8080:8080 -v ./appsettings.json:/app/appsettings.json vbilopav/npgsqlrest:latest-jit
```

The JIT version offers significantly better performance in high-concurrency scenarios (50-100% faster than AOT), but has slower cold-start times and a larger image size (~200-250 MB vs ~30 MB for AOT). For sustained high-throughput workloads, JIT is recommended.

**Available JIT image tags:**
- `vbilopav/npgsqlrest:latest-jit` - Latest version with JIT
- `vbilopav/npgsqlrest:3.6.3-jit` - Specific version with JIT

### ARM64 Image

A Docker image variant for ARM64 architecture (Raspberry Pi, AWS Graviton, Apple Silicon Linux VMs, etc.):

```bash
# Pull the ARM64 image variant
docker pull vbilopav/npgsqlrest:latest-arm

# Run with ARM64 runtime
docker run --name npgsqlrest-arm -it -p 8080:8080 -v ./appsettings.json:/app/appsettings.json vbilopav/npgsqlrest:latest-arm
```

The ARM64 build is compiled natively on GitHub's ARM64 runners for optimal performance on ARM-based systems.

**Available ARM64 image tags:**
- `vbilopav/npgsqlrest:latest-arm` - Latest version for ARM64
- `vbilopav/npgsqlrest:3.6.3-arm` - Specific version for ARM64

### Bun Runtime Image

A Docker image variant with pre-installed [Bun](https://bun.sh/) JavaScript runtime is available:

```bash
# Pull the Bun image variant
docker pull vbilopav/npgsqlrest:latest-bun

# Run with Bun runtime available
docker run --name npgsqlrest-bun -it -p 8080:8080 -v ./appsettings.json:/app/appsettings.json vbilopav/npgsqlrest:latest-bun
```

This image includes the Bun JavaScript runtime alongside NpgsqlRest, enabling [proxy endpoints](../config/proxy) to execute Bun scripts within the same container. Useful for scenarios where you need lightweight proxy handlers without external service calls.

**Available Bun image tags:**
- `vbilopav/npgsqlrest:latest-bun` - Latest version with Bun
- `vbilopav/npgsqlrest:3.6.3-bun` - Specific version with Bun

## Building From Source

Before building NpgsqlRest from source, ensure you have the following installed:

- Latest **.NET SDK** (from https://dotnet.microsoft.com/download)
- **Git** (to clone the repository)
- **PostgreSQL 13+** (for testing the build)

Clone the Repository

```bash
git clone https://github.com/vb-consulting/NpgsqlRest.git
cd NpgsqlRest
```

- Standard Build

```bash
dotnet build
```

- AOT (Ahead-of-Time) Compilation

NpgsqlRest supports AOT compilation for native executables:

```bash
# Windows (x64)
dotnet publish -r win-x64 -c Release --output ./dist

# Linux (x64) - must be run on Linux
dotnet publish -r linux-x64 -c Release --output ./dist

# macOS (ARM64)
dotnet publish -r osx-arm64 -c Release --output ./dist
```

For more information on build targets for specific OS, see the [.NET RID Catalog](https://learn.microsoft.com/en-us/dotnet/core/rid-catalog)

The AOT-compiled executable will be approximately 30MB and is self-contained with no runtime dependencies. The built executable will have the same functionality as the pre-compiled releases available on the GitHub releases page.

## Next Steps

- [Quick Start](./quick-start) - Create your first endpoint
- [Comment Annotations Guide](./annotations) - Use SQL comments to configure endpoints
- [Annotations Reference](../annotations/) - Complete reference of all annotations
- [Configuration Reference](../config/) - Complete reference for all configuration options

