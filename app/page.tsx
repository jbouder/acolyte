import Image from 'next/image';
import { TransitionLink } from '@/components/transition-link';
import { allTools, categoryTones, type ToolCategory } from '@/lib/tools-data';

/*
 * The tool lists themselves come from `lib/tools-data`, so a tool added there
 * shows up here automatically. Only the prose is page-specific.
 */
const sections: { category: ToolCategory; blurb: string }[] = [
  {
    category: 'API Testing',
    blurb:
      'Comprehensive API testing tools for REST, SSE, WebSocket, and chat endpoints. Test and debug your APIs with ease.',
  },
  {
    category: 'Analysis',
    blurb:
      'In-depth performance and dependency analysis tools to help you optimize your applications and understand your codebase.',
  },
  {
    category: 'Utilities',
    blurb:
      'Essential development utilities including markdown preview, mermaid diagrams, Base64 encoding, JSON formatting, regex testing, Swagger/OpenAPI viewer, and more to streamline your workflow.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-start border p-6">
        <Image
          src="/logo.png"
          alt="Acolyte Logo"
          width={700}
          height={400}
          priority
          className="h-auto max-w-full dark:invert"
        />
      </div>
      <div className="flex-1 border p-6">
        <p className="label-mono mb-3 text-muted-foreground">
          Project Acolyte · Web Tools
        </p>
        <p className="max-w-4xl text-lg">
          An app designed to assist web developers in their day-to-day duties.
          Whether you&apos;re testing APIs, analyzing apps, or utilizing helpful
          development utilities, Acolyte has all of the tools you need, in one
          helpful app.
        </p>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map(({ category, blurb }) => {
          const tone = categoryTones[category];
          const tools = allTools.filter((tool) => tool.category === category);

          return (
            <section
              key={category}
              className={`flex flex-col border border-l-2 p-4 ${tone.edge}`}
            >
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <span
                  aria-hidden="true"
                  className={`size-2.5 shrink-0 ${tone.swatch}`}
                />
                {category}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">{blurb}</p>
              <div className="mt-auto flex flex-wrap gap-1.5">
                {tools.map((tool) => (
                  <TransitionLink
                    key={tool.url}
                    href={tool.url}
                    className={`px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${tone.chip}`}
                  >
                    {tool.title}
                  </TransitionLink>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
