"use client";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Home</h1>
      </div>
      <div className="flex-1 rounded-xl bg-muted/50">
        <div className="p-6">
          <p className="text-muted-foreground">
            A collection of web development tools to help you build and test
            your applications.
          </p>
        </div>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-2">
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Browser Stats</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                User Agent:{" "}
                {typeof navigator !== "undefined"
                  ? navigator.userAgent.substring(0, 50) + "..."
                  : "N/A"}
              </div>
              <div>
                Language:{" "}
                {typeof navigator !== "undefined" ? navigator.language : "N/A"}
              </div>
              <div>
                Platform:{" "}
                {typeof navigator !== "undefined" ? navigator.platform : "N/A"}
              </div>
              <div>
                Cookies:{" "}
                {typeof navigator !== "undefined"
                  ? navigator.cookieEnabled
                    ? "Enabled"
                    : "Disabled"
                  : "N/A"}
              </div>
              <div>
                Online:{" "}
                {typeof navigator !== "undefined"
                  ? navigator.onLine
                    ? "Yes"
                    : "No"
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
        <div className="aspect-video rounded-xl bg-muted/50 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold mb-2">Location & Time</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Current Time: {new Date().toLocaleTimeString()}</div>
              <div>Date: {new Date().toLocaleDateString()}</div>
              <div>
                Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </div>
              <div>UTC Offset: {new Date().getTimezoneOffset() / -60}h</div>
              <div>Locale: {navigator.language || "N/A"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
