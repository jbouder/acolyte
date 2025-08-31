<p align="center">
  <img src="https://raw.githubusercontent.com/jbouder/acolyte/main/public/logo.png" alt="Acolyte Logo" width="400" />
</p>

<p align="center">
  <a href="https://github.com/jbouder/acolyte/blob/main/LICENSE.md">
    <img src="https://img.shields.io/github/license/jbouder/acolyte.svg" alt="License" />
  </a>
  <a href="https://github.com/jbouder/acolyte/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/jbouder/acolyte/code-quality.yml?branch=main" alt="Build Status" />
  </a>
  <a href="https://github.com/jbouder/acolyte">
    <img src="https://img.shields.io/github/stars/jbouder/acolyte?style=social" alt="GitHub Stars" />
  </a>
  <a href="https://github.com/jbouder/acolyte/releases">
    <img src="https://img.shields.io/github/v/release/jbouder/acolyte?include_prereleases" alt="Latest Release" />
  </a>
</p>

<p align="center">
  <strong>Acolyte</strong> is a comprehensive web application designed to assist developers in their day-to-day duties. Whether you're testing APIs, analyzing applications, or utilizing essential development utilities, Acolyte provides all the tools you need in one powerful, user-friendly interface.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#technology-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#usage">Usage</a> •
  <a href="#contributing">Contributing</a>
</p>

## Features

### 🧪 API Testing

- **REST API Testing** - Comprehensive testing tools for RESTful APIs with support for multiple HTTP methods, custom headers, and request/response validation
- **Server-Sent Events (SSE)** - Real-time event stream testing and monitoring
- **WebSocket Testing** - Full-duplex communication testing with message history and connection status monitoring
- **WebTransport Testing** - Modern transport protocol testing for low-latency applications

### 📊 Analysis Tools

- **Web Stats** - Provides detailed information about the current web client, including IP address, browser details, location, and system specifications
- **Website Analysis** - In-depth analysis of web applications including security headers, performance metrics, and best practices
- **Dependency Analysis** - Package.json analysis with vulnerability scanning, outdated package detection, and dependency tree visualization

### 🔧 Development Utilities

- **Base64 Encoder/Decoder** - Convert text and files to/from Base64 encoding with support for multiple formats
- **JSON Formatter** - Beautify, validate, and minify JSON with syntax highlighting and error detection
- **Regex Tester** - Test and debug regular expressions with real-time matching and explanation
- **Color Picker** - Advanced color selection tool with support for HEX, RGB, HSL, and HSV color spaces
- **JWT Decoder** - Decode and validate JSON Web Tokens with header and payload inspection
- **Developer Notepad** - Persistent note-taking with markdown support and local storage

### 🎮 Entertainment

- **Snake Game** - Classic arcade game with modern controls and scoring
- **Breakout** - Brick-breaking game with physics-based ball movement
- **Sudoku** - Number puzzle game with multiple difficulty levels

## Technology Stack

### Frontend

- **[Next.js 15.5.2](https://nextjs.org/)** - React framework with App Router for server-side rendering and routing
- **[React 19.1.0](https://react.dev/)** - Modern React with latest features and performance improvements
- **[TypeScript](https://www.typescriptlang.org/)** - Static type checking for enhanced developer experience
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework for rapid UI development
- **[Shadcn/UI](https://ui.shadcn.com/)** - High-quality, accessible component library

### Development Tools

- **[Jest](https://jestjs.io/)** - JavaScript testing framework with comprehensive test coverage
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - Simple and complete testing utilities
- **[ESLint](https://eslint.org/)** - Code analysis and linting for consistent code quality
- **[Prettier](https://prettier.io/)** - Code formatting for consistent style across the codebase

### Storage & Data

- **[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)** - Client-side storage for persistent data
- **Local Storage** - Browser storage for user preferences and temporary data

## Prerequisites

Before running Acolyte, ensure you have the following installed:

- **Node.js** (version 20.x or higher)
- **npm** (comes with Node.js)

## Getting Started

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/jbouder/acolyte.git
   cd acolyte
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

4. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Building for Production

To create an optimized production build:

```bash
npm run build
npm start
```

## Usage

### API Testing

1. Navigate to the **APIs** section from the homepage
2. Create multiple request tabs for different endpoints
3. Configure HTTP methods, headers, and request bodies
4. Send requests and analyze responses with syntax highlighting
5. Save and load project configurations for reuse

### Dependency Analysis

1. Go to **Dependency Analysis** from the Analysis section
2. Paste your `package.json` content into the editor
3. Click "Analyze Dependencies" to get insights about:
   - Total package count and categorization
   - Security vulnerabilities
   - Outdated packages
   - Dependency tree visualization

### Development Utilities

- **JSON Formatter**: Paste JSON and get formatted, validated output
- **Regex Tester**: Test patterns against sample text with real-time matching
- **Base64 Tools**: Encode/decode text and files
- **Color Picker**: Select colors and get values in multiple formats

## Project Structure

```
acolyte/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── apis/              # REST API testing interface
│   ├── base64/            # Base64 encoding/decoding tool
│   ├── color-picker/      # Color selection utility
│   ├── dependency-analysis/# Package analysis tool
│   ├── games/             # Browser games
│   ├── json-formatter/    # JSON formatting utility
│   ├── jwt/               # JWT decoder tool
│   ├── notepad/           # Developer notepad
│   ├── regex/             # Regular expression tester
│   ├── sse/               # Server-Sent Events testing
│   ├── web-stats/         # Website statistics analyzer
│   ├── websockets/        # WebSocket testing interface
│   └── webtransport/      # WebTransport testing tool
├── components/            # Reusable React components
├── lib/                   # Utility functions and helpers
├── public/                # Static assets
└── __tests__/             # Test files
```

## Development

### Code Quality

Acolyte maintains high code quality standards with comprehensive tooling:

```bash
# Run all tests
npm run test

# Lint code and auto-fix issues
npm run lint

# Format code with Prettier
npm run format

# Check formatting without making changes
npm run format:ci

# Lint code without auto-fixing (CI mode)
npm run lint:ci
```

### Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Testing individual components and utilities
- **Integration Tests**: Testing component interactions
- **Coverage**: 82.65% statement coverage with 79 passing tests

### Contributing

We welcome contributions to Acolyte! Here's how you can help:

1. **Fork the repository** on GitHub
2. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** and ensure tests pass
4. **Run code quality checks**
   ```bash
   npm run test
   npm run lint
   npm run format
   ```
5. **Commit your changes** with descriptive messages
6. **Push to your fork** and create a Pull Request

#### Development Guidelines

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint and Prettier)
- Write tests for new features and bug fixes
- Use semantic commit messages
- Update documentation when adding new features

### Architecture Decisions

- **Next.js App Router**: Provides server-side rendering and improved routing
- **TypeScript**: Ensures type safety and better developer experience
- **Tailwind CSS**: Enables rapid UI development with utility classes
- **Jest + React Testing Library**: Comprehensive testing setup
- **Component-based Architecture**: Promotes reusability and maintainability

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

<p align="center">
  Made with ❤️ for the developer community
</p>
