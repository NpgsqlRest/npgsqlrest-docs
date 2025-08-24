# Installation Instructions

NpgsqlRest can be installed and deployed in three different ways to suit your needs:

## Method 1: Download Executable (Recommended)

Download the appropriate native executable for your operating system from the [Releases page](https://github.com/NpgsqlRest/NpgsqlRest/releases).

### Steps:
1. Go to [Releases](https://github.com/NpgsqlRest/NpgsqlRest/releases)
2. Download the executable for your target OS
3. Make it executable (Linux/macOS): `chmod +x npgsqlrest`
4. Run: `./npgsqlrest`

**Advantages:**
- Zero dependencies
- Native performance
- Instant startup times
- No additional runtime installation required

## Method 2: NPM Package

Install via NPM for Node.js environments:

```bash
npm i npgsqlrest
```

### Usage:
```bash
npx npgsqlrest
```

**Note:** The NPM package automatically downloads the appropriate executable for your OS during installation.

## Method 3: Docker

Run using Docker with the official image:

```bash
docker run --name my_postgres_api -it -p 8080:8080 --volume ./appsettings.json:/app/appsettings.json vbilopav/npgsqlrest:latest
```

### Docker Prerequisites:
- Create an `appsettings.json` configuration file in your current directory
- The container exposes port 8080 by default

## System Requirements

- **PostgreSQL:** Version 13 or higher
- **Runtime:** No additional runtime dependencies (native executable)

## Quick Start Configuration

Create an `appsettings.json` file with your PostgreSQL connection:

```json
{
  "ConnectionStrings": {
    "Default": "Host=localhost;Port=5432;Database=my_db;Username=postgres;Password=postgres"
  }
}
```

## .NET Library Integration

For existing .NET applications:

```bash
dotnet add package NpgsqlRest
```

## Verification

After installation, verify the setup by running:
- Executable: `./npgsqlrest --version`
- NPM: `npx npgsqlrest --version`
- Docker: `docker run vbilopav/npgsqlrest:latest --version`

The server will start on `http://localhost:8080` by default.