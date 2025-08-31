'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Ball {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  color: string;
}

interface GameState {
  ball: Ball;
  paddle: Paddle;
  bricks: Brick[];
  score: number;
  lives: number;
  gameOver: boolean;
  gameWon: boolean;
  isPlaying: boolean;
}

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 10;
const BALL_RADIUS = 8;
const BRICK_ROWS = 8;
const BRICK_COLS = 10;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 20;
const BRICK_PADDING = 5;
const BRICK_OFFSET_TOP = 60;
const BRICK_OFFSET_LEFT = 35;

const createBricks = (): Brick[] => {
  const bricks: Brick[] = [];
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
  ];

  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      bricks.push({
        x: c * (BRICK_WIDTH + BRICK_PADDING) + BRICK_OFFSET_LEFT,
        y: r * (BRICK_HEIGHT + BRICK_PADDING) + BRICK_OFFSET_TOP,
        width: BRICK_WIDTH,
        height: BRICK_HEIGHT,
        visible: true,
        color: colors[r % colors.length],
      });
    }
  }
  return bricks;
};

const initialGameState: GameState = {
  ball: {
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT - 50,
    dx: 3,
    dy: -3,
  },
  paddle: {
    x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2,
    y: CANVAS_HEIGHT - 30,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
  },
  bricks: createBricks(),
  score: 0,
  lives: 3,
  gameOver: false,
  gameWon: false,
  isPlaying: false,
};

export default function BreakoutPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const mouseXRef = useRef<number>(CANVAS_WIDTH / 2);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    mouseXRef.current = (e.clientX - rect.left) * scaleX;
  }, []);

  const updateGame = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState.isPlaying || prevState.gameOver || prevState.gameWon)
        return prevState;

      const newState = { ...prevState };
      const ball = { ...newState.ball };
      const paddle = { ...newState.paddle };
      const bricks = [...newState.bricks];

      // Update paddle position
      paddle.x = mouseXRef.current - paddle.width / 2;
      if (paddle.x < 0) paddle.x = 0;
      if (paddle.x + paddle.width > CANVAS_WIDTH)
        paddle.x = CANVAS_WIDTH - paddle.width;

      // Update ball position
      ball.x += ball.dx;
      ball.y += ball.dy;

      // Ball collision with walls
      if (ball.x + BALL_RADIUS > CANVAS_WIDTH || ball.x - BALL_RADIUS < 0) {
        ball.dx = -ball.dx;
      }
      if (ball.y - BALL_RADIUS < 0) {
        ball.dy = -ball.dy;
      }

      // Ball collision with paddle
      if (
        ball.y + BALL_RADIUS > paddle.y &&
        ball.x > paddle.x &&
        ball.x < paddle.x + paddle.width
      ) {
        ball.dy = -ball.dy;
        // Add some angle based on where ball hits paddle
        const hitPos = (ball.x - paddle.x) / paddle.width;
        ball.dx = 3 * (hitPos - 0.5) * 2;
      }

      // Ball collision with bricks
      for (let i = 0; i < bricks.length; i++) {
        const brick = bricks[i];
        if (!brick.visible) continue;

        if (
          ball.x > brick.x &&
          ball.x < brick.x + brick.width &&
          ball.y > brick.y &&
          ball.y < brick.y + brick.height
        ) {
          ball.dy = -ball.dy;
          brick.visible = false;
          newState.score += 10;
          break;
        }
      }

      // Check if ball is below paddle (life lost)
      if (ball.y + BALL_RADIUS > CANVAS_HEIGHT) {
        newState.lives -= 1;
        if (newState.lives <= 0) {
          newState.gameOver = true;
          newState.isPlaying = false;
        } else {
          // Reset ball position
          ball.x = CANVAS_WIDTH / 2;
          ball.y = CANVAS_HEIGHT - 50;
          ball.dx = 3;
          ball.dy = -3;
        }
      }

      // Check if all bricks are destroyed
      const visibleBricks = bricks.filter((brick) => brick.visible);
      if (visibleBricks.length === 0) {
        newState.gameWon = true;
        newState.isPlaying = false;
      }

      return {
        ...newState,
        ball,
        paddle,
        bricks,
      };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousemove', handleMouseMove);
    return () => canvas.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const gameInterval = setInterval(updateGame, 16); // ~60 FPS
    return () => clearInterval(gameInterval);
  }, [updateGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw bricks
    gameState.bricks.forEach((brick) => {
      if (brick.visible) {
        ctx.fillStyle = brick.color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
      }
    });

    // Draw paddle
    ctx.fillStyle = '#10b981';
    ctx.fillRect(
      gameState.paddle.x,
      gameState.paddle.y,
      gameState.paddle.width,
      gameState.paddle.height,
    );

    // Draw ball
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(gameState.ball.x, gameState.ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Draw game over or win text
    if (gameState.gameOver || gameState.gameWon) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ctx.fillStyle = '#fff';
      ctx.font = '48px Arial';
      ctx.textAlign = 'center';
      const text = gameState.gameWon ? 'YOU WIN!' : 'GAME OVER';
      ctx.fillText(text, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

      ctx.font = '24px Arial';
      ctx.fillText(
        `Final Score: ${gameState.score}`,
        CANVAS_WIDTH / 2,
        CANVAS_HEIGHT / 2 + 50,
      );
    }
  }, [gameState]);

  const startGame = () => {
    setGameState({
      ...initialGameState,
      bricks: createBricks(),
      isPlaying: true,
    });
  };

  const resetGame = () => {
    setGameState({
      ...initialGameState,
      bricks: createBricks(),
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Breakout Game</h1>
        <p className="text-muted-foreground">
          Move your mouse to control the paddle. Bounce the ball to break all
          the bricks without letting the ball fall off the bottom!
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
                className="border border-border rounded-lg cursor-none"
                style={{ maxWidth: '100%', height: 'auto' }}
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
                <span className="font-medium">Bricks Left:</span>
                <span>
                  {gameState.bricks.filter((brick) => brick.visible).length}
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
                  <div>🖱️ Mouse - Move paddle left/right</div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <h3 className="font-medium">Rules:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Break all bricks to win</div>
                  <div>• Don&apos;t let the ball fall off the bottom</div>
                  <div>• You start with 3 lives</div>
                  <div>• Each brick gives 10 points</div>
                  <div>• Ball angle changes based on paddle hit position</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
