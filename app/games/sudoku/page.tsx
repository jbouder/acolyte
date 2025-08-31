'use client';

import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Cell {
  value: number;
  isFixed: boolean;
  isHighlighted: boolean;
  isError: boolean;
}

interface GameState {
  board: Cell[][];
  selectedCell: { row: number; col: number } | null;
  isComplete: boolean;
  difficulty: 'easy' | 'medium' | 'hard';
  timer: number;
  isPlaying: boolean;
}

// Easy Sudoku puzzles (more numbers filled in)
const easyPuzzles = [
  [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ],
  [
    [1, 0, 0, 4, 8, 9, 0, 0, 6],
    [7, 3, 0, 0, 0, 0, 0, 4, 0],
    [0, 0, 0, 0, 0, 1, 2, 9, 5],
    [0, 0, 7, 1, 2, 0, 6, 0, 0],
    [5, 0, 0, 7, 0, 3, 0, 0, 8],
    [0, 0, 6, 0, 9, 5, 7, 0, 0],
    [9, 1, 4, 6, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 0, 3, 7],
    [8, 0, 0, 5, 1, 2, 0, 0, 4],
  ],
  [
    [0, 0, 0, 6, 0, 0, 4, 0, 0],
    [7, 0, 0, 0, 0, 3, 6, 0, 0],
    [0, 0, 0, 0, 9, 1, 0, 8, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 5, 0, 1, 8, 0, 0, 0, 3],
    [0, 0, 0, 3, 0, 6, 0, 4, 5],
    [0, 4, 0, 2, 0, 0, 0, 6, 0],
    [9, 0, 3, 0, 0, 0, 0, 0, 0],
    [0, 2, 0, 0, 0, 0, 1, 0, 0],
  ],
  [
    [0, 2, 0, 6, 0, 8, 0, 0, 0],
    [5, 8, 0, 0, 0, 9, 7, 0, 0],
    [0, 0, 0, 0, 4, 0, 0, 0, 0],
    [3, 7, 0, 0, 0, 0, 5, 0, 0],
    [6, 0, 0, 0, 0, 0, 0, 0, 4],
    [0, 0, 8, 0, 0, 0, 0, 1, 3],
    [0, 0, 0, 0, 2, 0, 0, 0, 0],
    [0, 0, 9, 8, 0, 0, 0, 3, 6],
    [0, 0, 0, 3, 0, 6, 0, 9, 0],
  ],
  [
    [0, 0, 0, 2, 6, 0, 7, 0, 1],
    [6, 8, 0, 0, 7, 0, 0, 9, 0],
    [1, 9, 0, 0, 0, 4, 5, 0, 0],
    [8, 2, 0, 1, 0, 0, 0, 4, 0],
    [0, 0, 4, 6, 0, 2, 9, 0, 0],
    [0, 5, 0, 0, 0, 3, 0, 2, 8],
    [0, 0, 9, 3, 0, 0, 0, 7, 4],
    [0, 4, 0, 0, 5, 0, 0, 3, 6],
    [7, 0, 3, 0, 1, 8, 0, 0, 0],
  ],
  [
    [0, 0, 2, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 6, 0, 0, 0, 0, 3],
    [0, 7, 4, 0, 8, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 3, 0, 0, 2],
    [0, 8, 0, 0, 4, 0, 0, 1, 0],
    [6, 0, 0, 5, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 7, 8, 0],
    [5, 0, 0, 0, 0, 9, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 4, 0],
  ],
  [
    [8, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 3, 6, 0, 0, 0, 0, 0],
    [0, 7, 0, 0, 9, 0, 2, 0, 0],
    [0, 5, 0, 0, 0, 7, 0, 0, 0],
    [0, 0, 0, 0, 4, 5, 7, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 3, 0],
    [0, 0, 1, 0, 0, 0, 0, 6, 8],
    [0, 0, 8, 5, 0, 0, 0, 1, 0],
    [0, 9, 0, 0, 0, 0, 4, 0, 0],
  ],
  [
    [0, 0, 5, 3, 0, 0, 0, 0, 0],
    [8, 0, 0, 0, 0, 0, 0, 2, 0],
    [0, 7, 0, 0, 1, 0, 5, 0, 0],
    [4, 0, 0, 0, 0, 5, 3, 0, 0],
    [0, 1, 0, 0, 7, 0, 0, 0, 6],
    [0, 0, 3, 2, 0, 0, 0, 8, 0],
    [0, 6, 0, 5, 0, 0, 0, 0, 9],
    [0, 0, 4, 0, 0, 0, 0, 3, 0],
    [0, 0, 0, 0, 0, 9, 7, 0, 0],
  ],
  [
    [0, 4, 0, 0, 0, 0, 1, 7, 9],
    [0, 0, 2, 0, 0, 8, 0, 5, 4],
    [0, 0, 6, 0, 0, 5, 0, 0, 8],
    [0, 8, 0, 0, 7, 0, 9, 1, 0],
    [0, 5, 0, 0, 9, 0, 0, 3, 0],
    [0, 1, 9, 0, 8, 0, 0, 4, 0],
    [3, 0, 0, 4, 0, 0, 7, 0, 0],
    [2, 7, 0, 6, 0, 0, 5, 0, 0],
    [1, 9, 4, 0, 0, 0, 0, 6, 0],
  ],
  [
    [0, 0, 0, 1, 0, 5, 0, 0, 0],
    [1, 4, 0, 0, 0, 0, 6, 7, 2],
    [0, 2, 0, 0, 4, 0, 9, 1, 0],
    [4, 0, 6, 0, 0, 0, 2, 5, 0],
    [0, 1, 0, 0, 6, 0, 0, 3, 0],
    [0, 8, 5, 0, 0, 0, 1, 0, 6],
    [0, 6, 2, 0, 3, 0, 0, 8, 0],
    [8, 9, 4, 0, 0, 0, 0, 6, 1],
    [0, 0, 0, 6, 0, 1, 0, 0, 0],
  ],
];

const getRandomPuzzle = (): {
  puzzle: number[][];
  difficulty: 'easy';
} => {
  const randomPuzzle =
    easyPuzzles[Math.floor(Math.random() * easyPuzzles.length)];
  return {
    puzzle: randomPuzzle,
    difficulty: 'easy',
  };
};

const createBoard = (puzzle: number[][]): Cell[][] => {
  return puzzle.map((row) =>
    row.map((value) => ({
      value,
      isFixed: value !== 0,
      isHighlighted: false,
      isError: false,
    })),
  );
};

const isValidMove = (
  board: Cell[][],
  row: number,
  col: number,
  num: number,
): boolean => {
  // Check row
  for (let x = 0; x < 9; x++) {
    if (x !== col && board[row][x].value === num) {
      return false;
    }
  }

  // Check column
  for (let x = 0; x < 9; x++) {
    if (x !== row && board[x][col].value === num) {
      return false;
    }
  }

  // Check 3x3 box
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const currentRow = startRow + i;
      const currentCol = startCol + j;
      if (
        (currentRow !== row || currentCol !== col) &&
        board[currentRow][currentCol].value === num
      ) {
        return false;
      }
    }
  }

  return true;
};

const isBoardComplete = (board: Cell[][]): boolean => {
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      if (board[i][j].value === 0) {
        return false;
      }
    }
  }
  return true;
};

// Initialize with a random puzzle
const initialPuzzleData = getRandomPuzzle();

const initialGameState: GameState = {
  board: createBoard(initialPuzzleData.puzzle),
  selectedCell: null,
  isComplete: false,
  difficulty: initialPuzzleData.difficulty,
  timer: 0,
  isPlaying: false,
};

export default function SudokuPage() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);

  const handleCellClick = useCallback(
    (row: number, col: number) => {
      if (!gameState.isPlaying) return;

      setGameState((prev) => ({
        ...prev,
        selectedCell: { row, col },
        board: prev.board.map((boardRow, r) =>
          boardRow.map((cell, c) => ({
            ...cell,
            isHighlighted:
              r === row ||
              c === col ||
              (Math.floor(r / 3) === Math.floor(row / 3) &&
                Math.floor(c / 3) === Math.floor(col / 3)),
          })),
        ),
      }));
    },
    [gameState.isPlaying],
  );

  const handleNumberInput = useCallback(
    (num: number) => {
      if (!gameState.selectedCell || !gameState.isPlaying) return;

      const { row, col } = gameState.selectedCell;
      if (gameState.board[row][col].isFixed) return;

      setGameState((prev) => {
        const newBoard = prev.board.map((boardRow) =>
          boardRow.map((cell) => ({ ...cell })),
        );

        // Clear previous errors
        newBoard.forEach((boardRow) => {
          boardRow.forEach((cell) => {
            cell.isError = false;
          });
        });

        // Set the value
        newBoard[row][col].value = num;

        // Check for errors
        if (num !== 0 && !isValidMove(newBoard, row, col, num)) {
          newBoard[row][col].isError = true;
        }

        // Check if game is complete
        const isComplete =
          isBoardComplete(newBoard) &&
          !newBoard.flat().some((cell) => cell.isError);

        return {
          ...prev,
          board: newBoard,
          isComplete,
          isPlaying: !isComplete,
        };
      });
    },
    [gameState.selectedCell, gameState.isPlaying, gameState.board],
  );

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!gameState.isPlaying || !gameState.selectedCell) return;

      if (e.key >= '1' && e.key <= '9') {
        handleNumberInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
        handleNumberInput(0);
      }
    },
    [gameState.isPlaying, gameState.selectedCell, handleNumberInput],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState.isPlaying) {
      interval = setInterval(() => {
        setGameState((prev) => ({ ...prev, timer: prev.timer + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.isPlaying]);

  const startGame = () => {
    const newPuzzleData = getRandomPuzzle();
    setGameState({
      board: createBoard(newPuzzleData.puzzle),
      selectedCell: null,
      isComplete: false,
      difficulty: newPuzzleData.difficulty,
      timer: 0,
      isPlaying: true,
    });
  };

  const resetGame = () => {
    const newPuzzleData = getRandomPuzzle();
    setGameState({
      board: createBoard(newPuzzleData.puzzle),
      selectedCell: null,
      isComplete: false,
      difficulty: newPuzzleData.difficulty,
      timer: 0,
      isPlaying: false,
    });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCellClassName = (cell: Cell, row: number, col: number): string => {
    let className =
      'w-10 h-10 border border-gray-300 flex items-center justify-center text-lg font-medium cursor-pointer transition-colors ';

    if (cell.isFixed) {
      className +=
        'bg-gray-100 dark:bg-gray-800 font-bold text-blue-600 dark:text-blue-400 ';
    } else if (cell.isHighlighted) {
      className += 'bg-blue-100 dark:bg-blue-900/30 ';
    } else {
      className +=
        'bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900 ';
    }

    if (cell.isError) {
      className +=
        'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 ';
    }

    // Thick borders for 3x3 boxes
    if (row % 3 === 0)
      className += 'border-t-2 border-t-gray-800 dark:border-t-gray-200 ';
    if (row === 8)
      className += 'border-b-2 border-b-gray-800 dark:border-b-gray-200 ';
    if (col % 3 === 0)
      className += 'border-l-2 border-l-gray-800 dark:border-l-gray-200 ';
    if (col === 8)
      className += 'border-r-2 border-r-gray-800 dark:border-r-gray-200 ';

    return className;
  };

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Sudoku</h1>
        <p className="text-muted-foreground">
          Fill the 9×9 grid so that each column, row, and 3×3 box contains the
          digits 1-9 exactly once. Click on a cell and type a number or use the
          number buttons.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <Card>
            <CardHeader>
              <CardTitle>Sudoku Board</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="grid grid-cols-9 border-2 border-gray-800 dark:border-gray-200">
                {gameState.board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={getCellClassName(cell, rowIndex, colIndex)}
                      onClick={() => handleCellClick(rowIndex, colIndex)}
                    >
                      {cell.value !== 0 ? cell.value : ''}
                    </div>
                  )),
                )}
              </div>

              {gameState.isPlaying && gameState.selectedCell && (
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                    <Button
                      key={num}
                      variant="outline"
                      size="sm"
                      onClick={() => handleNumberInput(num)}
                      className="w-12 h-12"
                    >
                      {num === 0 ? '×' : num}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                {!gameState.isPlaying && !gameState.isComplete && (
                  <Button onClick={startGame}>Start Game</Button>
                )}
                {gameState.isComplete && (
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
                <span className="font-medium">Time:</span>
                <span className="text-lg font-bold font-mono">
                  {formatTime(gameState.timer)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Difficulty:</span>
                <span className="capitalize">{gameState.difficulty}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Status:</span>
                <span
                  className={`font-medium ${
                    gameState.isComplete
                      ? 'text-green-500'
                      : gameState.isPlaying
                        ? 'text-blue-500'
                        : 'text-yellow-500'
                  }`}
                >
                  {gameState.isComplete
                    ? 'Complete!'
                    : gameState.isPlaying
                      ? 'Playing'
                      : 'Ready'}
                </span>
              </div>

              <div className="pt-4 space-y-2">
                <h3 className="font-medium">Controls:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Click a cell to select it</div>
                  <div>Type 1-9 to enter numbers</div>
                  <div>Backspace/Delete to clear</div>
                  <div>Use number buttons below board</div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <h3 className="font-medium">Rules:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Each row must contain digits 1-9</div>
                  <div>• Each column must contain digits 1-9</div>
                  <div>• Each 3×3 box must contain digits 1-9</div>
                  <div>• No repeating numbers in any constraint</div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <h3 className="font-medium">Legend:</h3>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>• Blue numbers: Given (fixed)</div>
                  <div>• Black numbers: Your entries</div>
                  <div>• Red numbers: Invalid entries</div>
                  <div>• Blue highlight: Related cells</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
