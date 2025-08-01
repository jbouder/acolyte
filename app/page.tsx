export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-4">Welcome to Web Tools</h1>
          <p className="text-muted-foreground">
            A collection of web development tools to help you build and test
            your applications.
          </p>
        </div>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
        <div className="aspect-video rounded-xl bg-muted/50" />
      </div>
    </div>
  );
}
