import Image from 'next/image';
import Link from 'next/link';

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
          className="h-auto max-w-full"
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
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">API Testing</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Comprehensive API testing tools for REST, SSE, and WebSocket
              endpoints. Test and debug your APIs with ease.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/apis"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                APIs
              </Link>
              <Link
                href="/sse"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                SSE
              </Link>
              <Link
                href="/websockets"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                WebSockets
              </Link>
            </div>
          </div>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Analysis</h3>
            <p className="text-sm text-muted-foreground mb-3">
              In-depth performance and dependency analysis tools to help you
              optimize your applications and understand your codebase.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/web-stats"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Web Stats
              </Link>
              <Link
                href="/website-analysis"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Website Analysis
              </Link>
              <Link
                href="/dependency-analysis"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Dependency Analysis
              </Link>
            </div>
          </div>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Utilities</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Essential development utilities including JSON formatting, regex
              testing, Base64 encoding, and more to streamline your workflow.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/base64"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Base64 Encoding
              </Link>
              <Link
                href="/json-formatter"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                JSON Formatter
              </Link>
              <Link
                href="/regex"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Regex Tester
              </Link>
              <Link
                href="/color-picker"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Color Picker
              </Link>
              <Link
                href="/jwt"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                JWT Decoder
              </Link>
              <Link
                href="/notepad"
                className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:bg-primary/90 transition-colors"
              >
                Notepad
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
