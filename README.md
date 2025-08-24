# NpgsqlRest Documentation

This repository contains the official documentation for [NpgsqlRest](https://github.com/vb-consulting/NpgsqlRest), built with VitePress.

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Getting Started

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run docs:dev
   ```

4. Open your browser to `http://localhost:5173`

### Building

To build the documentation for production:

```bash
npm run docs:build
```

The built files will be in the `docs/.vitepress/dist` directory.

### Preview Production Build

To preview the production build locally:

```bash
npm run docs:preview
```

## Project Structure

```
docs/
├── .vitepress/
│   └── config.ts          # VitePress configuration
├── guide/                 # User guide
│   ├── index.md          # Getting started
│   └── quick-start.md    # Quick start guide
├── api/                   # API reference
│   └── index.md          # API documentation
├── examples/              # Examples
│   └── index.md          # Example gallery
└── index.md              # Home page
```

## Contributing

Contributions to the documentation are welcome! Please:

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

For major changes, please open an issue first to discuss what you would like to change.

## License

This documentation is licensed under the MIT License - see the [LICENSE](https://github.com/vb-consulting/NpgsqlRest/blob/master/LICENSE) file for details.