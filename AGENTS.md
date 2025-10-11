# Acolyte - Developer Tool Suite

## Overview

Acolyte is a comprehensive web application designed to assist developers in their day-to-day duties. Whether you're testing APIs, analyzing applications, or utilizing essential development utilities, Acolyte provides all the tools you need in one powerful, user-friendly interface.

**Repository**: https://github.com/jbouder/acolyte  
**License**: Apache License 2.0

## Key Features

### 🧪 API Testing Tools

#### REST API Testing

- Comprehensive testing tools for RESTful APIs
- Support for multiple HTTP methods (GET, POST, PUT, DELETE, PATCH, etc.)
- Custom headers and request configuration
- Request/response validation
- Multiple request tabs for different endpoints
- Save and load project configurations

#### Server-Sent Events (SSE)

- Real-time event stream testing
- Connection monitoring
- Event history tracking

#### WebSocket Testing

- Full-duplex communication testing
- Message history
- Connection status monitoring
- Real-time message exchange

#### WebTransport Testing

- Modern transport protocol testing
- Low-latency application testing
- Advanced connection management

### 📊 Analysis Tools

#### Web Stats

Provides detailed information about the current web client:

- IP address detection
- Browser details and capabilities
- Geographic location
- System specifications
- Screen resolution and color depth

#### Website Analysis

In-depth analysis of web applications including:

- Security headers inspection
- Performance metrics
- Best practices validation
- SEO analysis
- Accessibility checks

#### Dependency Analysis

Package.json analysis tool featuring:

- Vulnerability scanning
- Outdated package detection
- Dependency tree visualization
- Total package count and categorization
- Security recommendations

#### Accessibility Checker

Scan websites for accessibility issues and WCAG compliance:

- Automated accessibility testing
- WCAG 2.1 compliance checking
- Detection of missing alt text, labels, and ARIA attributes
- Heading structure validation
- Landmark and semantic HTML checks
- Detailed issue reporting with severity levels
- Export reports in JSON format

### 🔧 Development Utilities

#### Markdown Preview

- Real-time markdown editor
- Live preview rendering
- GitHub Flavored Markdown support
- Syntax highlighting
- Export capabilities

#### Base64 Encoder/Decoder

- Convert text to/from Base64 encoding
- File encoding support
- Multiple format support
- Copy to clipboard functionality

#### JSON Formatter

- Beautify JSON with proper indentation
- Validate JSON syntax
- Minify JSON for production
- Syntax highlighting
- Error detection and reporting

#### Regex Tester

- Test regular expressions in real-time
- Pattern matching visualization
- Sample text testing
- Explanation of regex patterns
- Common regex templates

#### Color Picker

- Advanced color selection tool
- Support for multiple color spaces:
  - HEX
  - RGB
  - HSL
  - HSV
- Color palette generation
- Copy color values

#### JWT Decoder

- Decode JSON Web Tokens
- Header inspection
- Payload inspection
- Signature validation
- Token expiration checking

#### Developer Notepad

- Persistent note-taking
- Markdown support
- Local storage
- Auto-save functionality
- Multiple notes management

### 🎮 Entertainment

#### Classic Games

- **Snake** - Classic arcade game with modern controls and scoring
- **Breakout** - Brick-breaking game with physics-based ball movement
- **Sudoku** - Number puzzle game with multiple difficulty levels

## Technology Stack

### Frontend

- **Next.js 15.5.2** - React framework with App Router for server-side rendering and routing
- **React 19.1.0** - Modern React with latest features and performance improvements
- **TypeScript** - Static type checking for enhanced developer experience
- **Tailwind CSS 4** - Utility-first CSS framework for rapid UI development
- **Shadcn/UI** - High-quality, accessible component library

### Development Tools

- **Jest** - JavaScript testing framework with comprehensive test coverage
- **React Testing Library** - Simple and complete testing utilities
- **ESLint** - Code analysis and linting for consistent code quality
- **Prettier** - Code formatting for consistent style across the codebase

### Storage & Data

- **IndexedDB** - Client-side storage for persistent data
- **Local Storage** - Browser storage for user preferences and temporary data

## Getting Started

### Prerequisites

- **Node.js** (version 20.x or higher)
- **npm** (comes with Node.js)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/jbouder/acolyte.git
   cd acolyte
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to http://localhost:3000

### Building for Production

Create an optimized production build:

```bash
npm run build
npm start
```

## Usage Examples

### API Testing Workflow

1. Navigate to the **APIs** section from the homepage
2. Create multiple request tabs for different endpoints
3. Configure HTTP methods, headers, and request bodies
4. Send requests and analyze responses with syntax highlighting
5. Save project configurations for reuse

### Dependency Analysis Workflow

1. Go to **Dependency Analysis** from the Analysis section
2. Paste your `package.json` content into the editor
3. Click "Analyze Dependencies" to get insights about:
   - Total package count and categorization
   - Security vulnerabilities
   - Outdated packages
   - Dependency tree visualization
4. Review recommendations and take action

### Markdown Preview Workflow

1. Open the **Markdown Preview** tool
2. Write markdown content in the editor
3. View live preview with syntax highlighting
4. Export rendered HTML or markdown
5. Save your work locally

## Project Structure

```
acolyte/
├── app/                    # Next.js App Router pages
│   ├── api/               # API route handlers
│   ├── accessibility-checker/# Accessibility scanning tool
│   ├── apis/              # REST API testing interface
│   ├── base64/            # Base64 encoding/decoding tool
│   ├── color-picker/      # Color selection utility
│   ├── dependency-analysis/# Package analysis tool
│   ├── games/             # Browser games
│   ├── json-formatter/    # JSON formatting utility
│   ├── jwt/               # JWT decoder tool
│   ├── markdown-preview/  # Markdown editor and preview
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

### Code Quality Commands

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

### Testing Coverage

The project maintains comprehensive test coverage:

- **Statement Coverage**: 82.65%
- **Passing Tests**: 79 tests
- Unit tests for components and utilities
- Integration tests for component interactions

## Contributing

Contributions are welcome! Follow these steps:

1. Fork the repository on GitHub
2. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes and ensure tests pass
4. Run code quality checks:
   ```bash
   npm run test
   npm run lint
   npm run format
   ```
5. Commit your changes with descriptive messages
6. Push to your fork and create a Pull Request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code style (enforced by ESLint and Prettier)
- Write tests for new features and bug fixes
- Use semantic commit messages
- Update documentation when adding new features

## Architecture Decisions

- **Next.js App Router**: Provides server-side rendering and improved routing
- **TypeScript**: Ensures type safety and better developer experience
- **Tailwind CSS**: Enables rapid UI development with utility classes
- **Jest + React Testing Library**: Comprehensive testing setup
- **Component-based Architecture**: Promotes reusability and maintainability

## Acknowledgments

- Built with [Next.js](https://nextjs.org/) and [React](https://react.dev/)
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

Made with ❤️ for the developer community
