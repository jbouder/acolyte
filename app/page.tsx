import Image from 'next/image';
import { TransitionLink } from '@/components/transition-link';

export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="rounded-xl bg-muted/50 p-6 flex items-center justify-start">
        <Image
          src="/logo.png"
          alt="Acolyte Logo"
          width={700}
          height={400}
          priority
          className="h-auto max-w-full dark:invert"
        />
      </div>
      <div className="flex-1 rounded-xl bg-muted/50 p-6 flex items-center">
        <p className="text-muted-foreground text-lg">
          An app designed to assist web developers in their day-to-day duties.
          Whether you&apos;re testing APIs, analyzing apps, or utilizing helpful
          development utilities, Acolyte has all of the tools you need, in one
          helpful app.
        </p>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">API Testing</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Comprehensive API testing tools for REST, SSE, WebSocket, and chat
              endpoints. Test and debug your APIs with ease.
            </p>
            <div className="flex flex-wrap gap-2">
              <TransitionLink
                href="/apis"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                APIs
              </TransitionLink>
              <TransitionLink
                href="/sse"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                SSE
              </TransitionLink>
              <TransitionLink
                href="/websockets"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                WebSockets
              </TransitionLink>
              <TransitionLink
                href="/chat"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Chat
              </TransitionLink>
            </div>
          </div>
        </div>
        <div className="md:aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Analysis</h3>
            <p className="text-sm text-muted-foreground mb-3">
              In-depth performance and dependency analysis tools to help you
              optimize your applications and understand your codebase.
            </p>
            <div className="flex flex-wrap gap-2">
              <TransitionLink
                href="/web-stats"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Web Stats
              </TransitionLink>
              <TransitionLink
                href="/website-analysis"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Website Analysis
              </TransitionLink>
              <TransitionLink
                href="/dependency-analysis"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Dependency Analysis
              </TransitionLink>
              <TransitionLink
                href="/sbom-report"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                SBOM Report
              </TransitionLink>
              <TransitionLink
                href="/accessibility-checker"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Accessibility Checker
              </TransitionLink>
            </div>
          </div>
        </div>
        <div className="md:aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Utilities</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Essential development utilities including markdown preview,
              mermaid diagrams, Base64 encoding, JSON formatting, regex testing,
              Swagger/OpenAPI viewer, and more to streamline your workflow.
            </p>
            <div className="flex flex-wrap gap-2">
              <TransitionLink
                href="/markdown-preview"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Markdown Preview
              </TransitionLink>
              <TransitionLink
                href="/mermaid-preview"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Mermaid Preview
              </TransitionLink>
              <TransitionLink
                href="/base64"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Base64 Encoding
              </TransitionLink>
              <TransitionLink
                href="/json-formatter"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                JSON Formatter
              </TransitionLink>
              <TransitionLink
                href="/regex"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Regex Tester
              </TransitionLink>
              <TransitionLink
                href="/color-picker"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Color Picker
              </TransitionLink>
              <TransitionLink
                href="/jwt"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                JWT Decoder
              </TransitionLink>
              <TransitionLink
                href="/password-generator"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Password Generator
              </TransitionLink>
              <TransitionLink
                href="/swagger-viewer"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Swagger Viewer
              </TransitionLink>
              <TransitionLink
                href="/image-tools"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Image Tools
              </TransitionLink>
              <TransitionLink
                href="/notepad"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Notepad
              </TransitionLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
