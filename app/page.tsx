export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Project Acolyte</h1>
      </div>
      <div className="flex-1 rounded-xl bg-muted/50">
        <div className="p-6">
          <p className="text-muted-foreground">
            A tool designed to assist web developers in their day-to-day duties.
            Whether you&apos;re testing APIs, analyzing performance, or
            utilizing helpful development utilities, Acolyte provides the
            essential features you need to be more productive and efficient.
          </p>
        </div>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">🧪 API Testing</h3>
            <p className="text-sm text-muted-foreground">
              Comprehensive API testing tools for REST, SSE, and WebSocket
              endpoints. Test and debug your APIs with ease.
            </p>
          </div>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">📊 Analysis</h3>
            <p className="text-sm text-muted-foreground">
              In-depth performance and dependency analysis tools to help you
              optimize your applications and understand your codebase.
            </p>
          </div>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">🔧 Utilities</h3>
            <p className="text-sm text-muted-foreground">
              Essential development utilities including JSON formatting, regex
              testing, Base64 encoding, and more to streamline your workflow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
