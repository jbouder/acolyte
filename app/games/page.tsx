'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const CORRECT_PASSWORDS = ['plagueis', 'darth plagueis'];
const STORAGE_KEY = 'games-password-verified';

const games = [
  {
    title: 'Snake',
    description:
      'Classic snake game where you control a growing snake to eat food while avoiding walls and yourself.',
    url: '/games/snake',
  },
  {
    title: 'Breakout',
    description:
      'Break all the bricks with a bouncing ball controlled by a paddle.',
    url: '/games/breakout',
  },
  {
    title: 'Sudoku',
    description:
      'Fill the 9×9 grid so each row, column, and 3×3 box contains digits 1-9 exactly once.',
    url: '/games/sudoku',
  },
];

export default function GamesPage() {
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Check if password was previously verified
    const verified = localStorage.getItem(STORAGE_KEY) === 'true';
    setIsPasswordVerified(verified);
    setShowModal(!verified);
  }, []);

  const handlePasswordSubmit = () => {
    const enteredPassword = password.toLowerCase().trim();
    if (
      CORRECT_PASSWORDS.some(
        (correctPassword) => enteredPassword === correctPassword,
      )
    ) {
      // Correct password
      localStorage.setItem(STORAGE_KEY, 'true');
      setIsPasswordVerified(true);
      setShowModal(false);
      setErrorMessage('');
      setPassword('');
    } else {
      // Incorrect password
      setErrorMessage('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePasswordSubmit();
    }
  };

  if (!isPasswordVerified) {
    return (
      <Dialog open={showModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Restricted Area</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Have you heard the tragedy of…"
                autoFocus
              />
              {errorMessage && (
                <p className="text-sm text-red-500">{errorMessage}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handlePasswordSubmit}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
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
            className="transition-colors hover:bg-muted/50 flex flex-col"
          >
            <CardHeader className="flex-1">
              <CardTitle className="text-xl">{game.title}</CardTitle>
              <CardDescription>{game.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Link
                href={game.url}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
              >
                Play Game
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
