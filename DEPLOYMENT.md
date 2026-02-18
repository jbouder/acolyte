# Deployment Guide

## Vercel Deployment

This application is optimized for deployment on Vercel and other serverless platforms.

### Accessibility Checker - Puppeteer Configuration

The Accessibility Checker feature uses Puppeteer to run automated accessibility tests. Due to serverless environment constraints, we use:

- **`puppeteer-core`**: A lightweight version of Puppeteer without the bundled Chromium binary
- **`@sparticuz/chromium`**: A pre-compiled Chromium binary optimized for serverless environments

#### How It Works

The implementation automatically detects the environment:

- **Development**: Uses your local Chrome installation (macOS path by default)
- **Production/Vercel**: Uses the serverless-optimized Chromium binary from `@sparticuz/chromium`

#### Environment Variables (Optional)

You can set the following environment variable for local development if Chrome is installed in a non-standard location:

```bash
PUPPETEER_EXECUTABLE_PATH=/path/to/your/chrome
```

Common Chrome paths:

- **macOS**: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
- **Linux**: `/usr/bin/google-chrome`
- **Windows**: `C:\Program Files\Google\Chrome\Application\chrome.exe`

#### Vercel Configuration

No special configuration is needed for Vercel. The `@sparticuz/chromium` package will automatically download and use the appropriate Chromium binary during the build process.

The package is optimized for:

- AWS Lambda
- Vercel Functions
- Netlify Functions
- Google Cloud Functions

#### Testing Locally

To test the serverless configuration locally:

1. Set `NODE_ENV=production` in your environment
2. Run the development server:
   ```bash
   NODE_ENV=production npm run dev
   ```

This will use the serverless Chromium binary instead of your local Chrome installation.

#### Troubleshooting

If you encounter issues with the Accessibility Checker in production:

1. **Timeout Errors**: The serverless function has a default timeout (usually 10s on free tier). Consider upgrading your Vercel plan for longer function execution times.

2. **Memory Issues**: Chromium requires significant memory. Ensure your serverless function has at least 1GB of memory allocated.

3. **Binary Not Found**: If `@sparticuz/chromium` fails to download during build, check your build logs and ensure the package is in `dependencies` (not `devDependencies`).

## Other Platforms

### AWS Lambda

The same configuration works on AWS Lambda. Ensure:

- Function timeout is set to at least 30 seconds
- Memory is set to at least 1GB

### Docker

If deploying with Docker, you'll need to install Chrome/Chromium in your container:

```dockerfile
RUN apt-get update && apt-get install -y \
    chromium \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

## Performance Considerations

- Each accessibility scan launches a new browser instance, which can be resource-intensive
- Consider implementing rate limiting for the accessibility checker endpoint
- Cache results when possible to reduce redundant scans
