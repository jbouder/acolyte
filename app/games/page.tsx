import Link from 'next/link';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const games = [
  {
    title: 'Snake',
    description:
      'Classic snake game where you control a growing snake to eat food while avoiding walls and yourself.',
    url: '/games/snake',
    status: 'Available',
  },
  {
    title: 'Tetris',
    description:
      'The classic falling block puzzle game where you arrange shapes to clear lines.',
    url: '/games/tetris',
    status: 'Coming Soon',
  },
  {
    title: 'Breakout',
    description:
      'Break all the bricks with a bouncing ball controlled by a paddle.',
    url: '/games/breakout',
    status: 'Coming Soon',
  },
  {
    title: 'Pac-Man',
    description: 'Navigate through a maze, eating dots while avoiding ghosts.',
    url: '/games/pacman',
    status: 'Coming Soon',
  },
];

export default function GamesPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Games</h1>
        <p className="text-muted-foreground">
          Take a break from development with these classic games built with web
          technologies.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card
            key={game.title}
            className="transition-colors hover:bg-muted/50"
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">{game.title}</CardTitle>
                <div className="flex gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      game.status === 'Available'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}
                  >
                    {game.status}
                  </span>
                </div>
              </div>
              <CardDescription>{game.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {game.status === 'Available' ? (
                <Link
                  href={game.url}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
                >
                  Play Game
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full opacity-50 cursor-not-allowed"
                >
                  Coming Soon
                </button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
