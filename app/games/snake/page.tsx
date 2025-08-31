'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: Position;
  gameOver: boolean;
  score: number;
  isPlaying: boolean;
}

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;

const initialGameState: GameState = {
  snake: [{ x: 10, y: 10 }],
  food: { x: 15, y: 15 },
  direction: { x: 0, y: 0 },
  gameOver: false,
  score: 0,
  isPlaying: false,
};

export default function SnakePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const generateFood = useCallback((snake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_SIZE / GRID_SIZE)),
      };
    } while (
      snake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y,
      )
    );
    return newFood;
  }, []);

  const moveSnake = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState.isPlaying || prevState.gameOver) return prevState;

      const newSnake = [...prevState.snake];
      const head = { ...newSnake[0] };

      head.x += prevState.direction.x;
      head.y += prevState.direction.y;

      // Check wall collision
      if (
        head.x < 0 ||
        head.x >= CANVAS_SIZE / GRID_SIZE ||
        head.y < 0 ||
        head.y >= CANVAS_SIZE / GRID_SIZE
      ) {
        return { ...prevState, gameOver: true, isPlaying: false };
      }

      // Check self collision
      if (
        newSnake.some((segment) => segment.x === head.x && segment.y === head.y)
      ) {
        return { ...prevState, gameOver: true, isPlaying: false };
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === prevState.food.x && head.y === prevState.food.y) {
        const newFood = generateFood(newSnake);
        return {
          ...prevState,
          snake: newSnake,
          food: newFood,
          score: prevState.score + 10,
        };
      } else {
        newSnake.pop();
        return { ...prevState, snake: newSnake };
      }
    });
  }, [generateFood]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    setGameState((prevState) => {
      if (!prevState.isPlaying) return prevState;

      let newDirection = { ...prevState.direction };

      switch (e.key) {
        case 'ArrowUp':
          if (prevState.direction.y !== 1) newDirection = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
          if (prevState.direction.y !== -1) newDirection = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
          if (prevState.direction.x !== 1) newDirection = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
          if (prevState.direction.x !== -1) newDirection = { x: 1, y: 0 };
          break;
      }

      return { ...prevState, direction: newDirection };
    });
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    const gameInterval = setInterval(moveSnake, 150);
    return () => clearInterval(gameInterval);
  }, [moveSnake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw grid
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    // Draw snake
    ctx.fillStyle = '#10b981';
    gameState.snake.forEach((segment, index) => {
      if (index === 0) {
        // Head
        ctx.fillStyle = '#059669';
      } else {
        ctx.fillStyle = '#10b981';
      }
      ctx.fillRect(
        segment.x * GRID_SIZE + 1,
        segment.y * GRID_SIZE + 1,
        GRID_SIZE - 2,
        GRID_SIZE - 2,
      );
    });

    // Draw food
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(
      gameState.food.x * GRID_SIZE + 1,
      gameState.food.y * GRID_SIZE + 1,
      GRID_SIZE - 2,
      GRID_SIZE - 2,
    );
  }, [gameState]);

  const startGame = () => {
    setGameState({
      ...initialGameState,
      isPlaying: true,
      direction: { x: 1, y: 0 },
    });
  };

  const resetGame = () => {
    setGameState(initialGameState);
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Snake Game</h1>
        <p className="text-muted-foreground">
          Control the snake with arrow keys. Eat the red food to grow and
          increase your score. Don&apos;t hit the walls or yourself!
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
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="border border-border rounded-lg"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
              <div className="flex gap-2">
                {!gameState.isPlaying && !gameState.gameOver && (
                  <Button onClick={startGame}>Start Game</Button>
                )}
                {gameState.gameOver && (
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
                <span className="font-medium">Length:</span>
                <span>{gameState.snake.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span
                  className={`font-medium ${
                    gameState.gameOver
                      ? 'text-red-500'
                      : gameState.isPlaying
                        ? 'text-green-500'
                        : 'text-yellow-500'
                  }`}
                >
                  {gameState.gameOver
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
                <h3 className="font-medium">Rules:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Eat red food to grow and score points</div>
                  <div>• Don&apos;t hit the walls</div>
                  <div>• Don&apos;t hit yourself</div>
                  <div>• Each food gives 10 points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
