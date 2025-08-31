'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  x: number;
  y: number;
  direction: string;
  color: string;
  mode: 'chase' | 'scatter' | 'frightened';
}

interface GameState {
  pacman: Position & { direction: string };
  ghosts: Ghost[];
  dots: boolean[][];
  powerPellets: Position[];
  score: number;
  lives: number;
  gameOver: boolean;
  gameWon: boolean;
  isPlaying: boolean;
  frightenedTimer: number;
}

const CELL_SIZE = 20;
const MAZE_WIDTH = 19;
const MAZE_HEIGHT = 21;
const CANVAS_WIDTH = MAZE_WIDTH * CELL_SIZE;
const CANVAS_HEIGHT = MAZE_HEIGHT * CELL_SIZE;

// Simple maze layout (1 = wall, 0 = dot, 2 = power pellet, 3 = empty)
const maze = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 2, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 2, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 0, 1, 1, 1, 3, 1, 3, 1, 1, 1, 0, 1, 1, 1, 1],
  [3, 3, 3, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 3, 3, 3],
  [1, 1, 1, 1, 0, 1, 3, 1, 1, 3, 1, 1, 3, 1, 0, 1, 1, 1, 1],
  [0, 0, 0, 0, 0, 3, 3, 1, 3, 3, 3, 1, 3, 3, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 0, 1, 3, 1, 1, 1, 1, 1, 3, 1, 0, 1, 1, 1, 1],
  [3, 3, 3, 1, 0, 1, 3, 3, 3, 3, 3, 3, 3, 1, 0, 1, 3, 3, 3],
  [1, 1, 1, 1, 0, 1, 1, 1, 3, 1, 3, 1, 1, 1, 0, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1],
  [1, 2, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 2, 1],
  [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const createDots = (): boolean[][] => {
  return maze.map((row) => row.map((cell) => cell === 0));
};

const createPowerPellets = (): Position[] => {
  const pellets: Position[] = [];
  maze.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 2) {
        pellets.push({ x, y });
      }
    });
  });
  return pellets;
};

const initialGameState: GameState = {
  pacman: { x: 9, y: 15, direction: 'right' },
  ghosts: [
    { x: 9, y: 9, direction: 'up', color: '#ff0000', mode: 'chase' },
    { x: 8, y: 9, direction: 'up', color: '#ffb8ff', mode: 'chase' },
    { x: 10, y: 9, direction: 'up', color: '#00ffff', mode: 'chase' },
    { x: 9, y: 8, direction: 'up', color: '#ffb852', mode: 'chase' },
  ],
  dots: createDots(),
  powerPellets: createPowerPellets(),
  score: 0,
  lives: 3,
  gameOver: false,
  gameWon: false,
  isPlaying: false,
  frightenedTimer: 0,
};

export default function PacmanPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [keys, setKeys] = useState<Set<string>>(new Set());

  const isValidMove = useCallback((x: number, y: number): boolean => {
    if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT) return false;
    return maze[y][x] !== 1;
  }, []);

  const getNextPosition = useCallback(
    (x: number, y: number, direction: string) => {
      switch (direction) {
        case 'up':
          return { x, y: y - 1 };
        case 'down':
          return { x, y: y + 1 };
        case 'left':
          return { x: x - 1, y };
        case 'right':
          return { x: x + 1, y };
        default:
          return { x, y };
      }
    },
    [],
  );

  const moveGhosts = useCallback(
    (ghosts: Ghost[], pacman: Position, frightenedTimer: number) => {
      return ghosts.map((ghost) => {
        const directions = ['up', 'down', 'left', 'right'];
        const validMoves = directions.filter((dir) => {
          const next = getNextPosition(ghost.x, ghost.y, dir);
          return isValidMove(next.x, next.y);
        });

        if (validMoves.length === 0) return ghost;

        // Simple AI: if frightened, move randomly, otherwise move towards pacman
        let newDirection;
        if (frightenedTimer > 0) {
          newDirection =
            validMoves[Math.floor(Math.random() * validMoves.length)];
        } else {
          // Simple chase AI - move towards pacman
          const distances = validMoves.map((dir) => {
            const next = getNextPosition(ghost.x, ghost.y, dir);
            return {
              direction: dir,
              distance:
                Math.abs(next.x - pacman.x) + Math.abs(next.y - pacman.y),
            };
          });
          distances.sort((a, b) => a.distance - b.distance);
          newDirection = distances[0].direction;
        }

        const next = getNextPosition(ghost.x, ghost.y, newDirection);

        return {
          ...ghost,
          x: next.x,
          y: next.y,
          direction: newDirection,
          mode: frightenedTimer > 0 ? 'frightened' : 'chase',
        };
      });
    },
    [getNextPosition, isValidMove],
  );

  const updateGame = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState.isPlaying || prevState.gameOver || prevState.gameWon) {
        return prevState;
      }

      const newState = { ...prevState };
      let newDirection = newState.pacman.direction;

      // Handle input
      if (
        keys.has('ArrowUp') &&
        isValidMove(newState.pacman.x, newState.pacman.y - 1)
      ) {
        newDirection = 'up';
      } else if (
        keys.has('ArrowDown') &&
        isValidMove(newState.pacman.x, newState.pacman.y + 1)
      ) {
        newDirection = 'down';
      } else if (
        keys.has('ArrowLeft') &&
        isValidMove(newState.pacman.x - 1, newState.pacman.y)
      ) {
        newDirection = 'left';
      } else if (
        keys.has('ArrowRight') &&
        isValidMove(newState.pacman.x + 1, newState.pacman.y)
      ) {
        newDirection = 'right';
      }

      // Move Pacman
      const nextPos = getNextPosition(
        newState.pacman.x,
        newState.pacman.y,
        newDirection,
      );
      if (isValidMove(nextPos.x, nextPos.y)) {
        newState.pacman = { ...nextPos, direction: newDirection };
      }

      // Check dot collection
      if (
        newState.dots[newState.pacman.y] &&
        newState.dots[newState.pacman.y][newState.pacman.x]
      ) {
        newState.dots[newState.pacman.y][newState.pacman.x] = false;
        newState.score += 10;
      }

      // Check power pellet collection
      const pelletIndex = newState.powerPellets.findIndex(
        (pellet) =>
          pellet.x === newState.pacman.x && pellet.y === newState.pacman.y,
      );
      if (pelletIndex !== -1) {
        newState.powerPellets.splice(pelletIndex, 1);
        newState.score += 50;
        newState.frightenedTimer = 200; // About 10 seconds at 20 FPS
      }

      // Update frightened timer
      if (newState.frightenedTimer > 0) {
        newState.frightenedTimer--;
      }

      // Move ghosts
      newState.ghosts = moveGhosts(
        newState.ghosts,
        newState.pacman,
        newState.frightenedTimer,
      );

      // Check ghost collisions
      const ghostCollision = newState.ghosts.find(
        (ghost) =>
          ghost.x === newState.pacman.x && ghost.y === newState.pacman.y,
      );

      if (ghostCollision) {
        if (newState.frightenedTimer > 0) {
          // Eat the ghost
          newState.score += 200;
          // Reset ghost to center (simple implementation)
          ghostCollision.x = 9;
          ghostCollision.y = 9;
        } else {
          // Lose a life
          newState.lives--;
          if (newState.lives <= 0) {
            newState.gameOver = true;
            newState.isPlaying = false;
          } else {
            // Reset positions
            newState.pacman = { x: 9, y: 15, direction: 'right' };
            newState.ghosts = initialGameState.ghosts.map((ghost) => ({
              ...ghost,
            }));
          }
        }
      }

      // Check win condition (all dots collected)
      const remainingDots = newState.dots.flat().filter(Boolean).length;
      if (remainingDots === 0 && newState.powerPellets.length === 0) {
        newState.gameWon = true;
        newState.isPlaying = false;
      }

      return newState;
    });
  }, [keys, isValidMove, getNextPosition, moveGhosts]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    setKeys((prev) => new Set(prev).add(e.key));
  }, []);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    setKeys((prev) => {
      const newKeys = new Set(prev);
      newKeys.delete(e.key);
      return newKeys;
    });
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const gameInterval = setInterval(updateGame, 150); // Slower than other games
    return () => clearInterval(gameInterval);
  }, [updateGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw maze
    ctx.fillStyle = '#0000ff';
    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }
      });
    });

    // Draw dots
    ctx.fillStyle = '#ffff00';
    gameState.dots.forEach((row, y) => {
      row.forEach((hasDot, x) => {
        if (hasDot) {
          ctx.beginPath();
          ctx.arc(
            x * CELL_SIZE + CELL_SIZE / 2,
            y * CELL_SIZE + CELL_SIZE / 2,
            2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      });
    });

    // Draw power pellets
    ctx.fillStyle = '#ffff00';
    gameState.powerPellets.forEach((pellet) => {
      ctx.beginPath();
      ctx.arc(
        pellet.x * CELL_SIZE + CELL_SIZE / 2,
        pellet.y * CELL_SIZE + CELL_SIZE / 2,
        6,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    // Draw Pacman
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(
      gameState.pacman.x * CELL_SIZE + CELL_SIZE / 2,
      gameState.pacman.y * CELL_SIZE + CELL_SIZE / 2,
      8,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    // Draw ghosts
    gameState.ghosts.forEach((ghost) => {
      ctx.fillStyle = gameState.frightenedTimer > 0 ? '#0000ff' : ghost.color;
      ctx.beginPath();
      ctx.arc(
        ghost.x * CELL_SIZE + CELL_SIZE / 2,
        ghost.y * CELL_SIZE + CELL_SIZE / 2,
        8,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    // Draw game over or win text
    if (gameState.gameOver || gameState.gameWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#ffff00';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      const text = gameState.gameWon ? 'YOU WIN!' : 'GAME OVER';
      ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

      ctx.font = '16px Arial';
      ctx.fillText(
        `Final Score: ${gameState.score}`,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 + 30,
      );
    }
  }, [gameState]);

  const startGame = () => {
    setGameState({
      ...initialGameState,
      dots: createDots(),
      powerPellets: createPowerPellets(),
      isPlaying: true,
    });
  };

  const resetGame = () => {
    setGameState({
      ...initialGameState,
      dots: createDots(),
      powerPellets: createPowerPellets(),
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Pac-Man Game</h1>
        <p className="text-muted-foreground">
          Use arrow keys to guide Pac-Man through the maze. Eat all the dots
          while avoiding the ghosts. Power pellets make ghosts vulnerable!
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Game Board</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border border-border rounded-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
                tabIndex={0}
              />
              <div className="flex gap-2">
                {!gameState.isPlaying &&
                  !gameState.gameOver &&
                  !gameState.gameWon && (
                    <Button onClick={startGame}>Start Game</Button>
                  )}
                {(gameState.gameOver || gameState.gameWon) && (
                  <Button onClick={startGame}>Play Again</Button>
                )}
                {gameState.isPlaying && (
                  <Button variant="outline" onClick={resetGame}>
                    Reset Game
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:w-80">
          <Card>
            <CardHeader>
              <CardTitle>Game Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="font-medium">Score:</span>
                <span className="text-lg font-bold">{gameState.score}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Lives:</span>
                <span className="text-lg font-bold">{gameState.lives}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Dots Left:</span>
                <span>
                  {gameState.dots.flat().filter(Boolean).length +
                    gameState.powerPellets.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Power Mode:</span>
                <span
                  className={
                    gameState.frightenedTimer > 0
                      ? 'text-blue-500'
                      : 'text-gray-500'
                  }
                >
                  {gameState.frightenedTimer > 0 ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span
                  className={`font-medium ${
                    gameState.gameWon
                      ? 'text-green-500'
                      : gameState.gameOver
                        ? 'text-red-500'
                        : gameState.isPlaying
                          ? 'text-blue-500'
                          : 'text-yellow-500'
                  }`}
                >
                  {gameState.gameWon
                    ? 'You Win!'
                    : gameState.gameOver
                      ? 'Game Over'
                      : gameState.isPlaying
                        ? 'Playing'
                        : 'Ready'}
                </span>
              </div>

              <div className="pt-4 space-y-2">
                <h3 className="font-medium">Controls:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>↑ Arrow Up - Move Up</div>
                  <div>↓ Arrow Down - Move Down</div>
                  <div>← Arrow Left - Move Left</div>
                  <div>→ Arrow Right - Move Right</div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <h3 className="font-medium">Scoring:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Small Dot: 10 points</div>
                  <div>• Power Pellet: 50 points</div>
                  <div>• Ghost (during power mode): 200 points</div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <h3 className="font-medium">Rules:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Eat all dots to win</div>
                  <div>• Avoid ghosts (red, pink, cyan, orange)</div>
                  <div>• Power pellets make ghosts blue and edible</div>
                  <div>• You start with 3 lives</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
