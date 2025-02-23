import React, { useState, useEffect } from 'react';
import { Moon, Sun, Droplet, Battery, Heart, AlertTriangle } from 'lucide-react';

interface Resources {
  energy: number;
  water: number;
  food: number;
  health: number;
}

function App() {
  const [resources, setResources] = useState<Resources>({
    energy: 100,
    water: 100,
    food: 100,
    health: 100,
  });
  const [day, setDay] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = (message: string) => {
    setMessages(prev => [message, ...prev].slice(0, 5));
  };

  useEffect(() => {
    if (gameOver) return;

    const interval = setInterval(() => {
      setResources(prev => {
        const newResources = {
          energy: Math.max(0, prev.energy - 2),
          water: Math.max(0, prev.water - 1.5),
          food: Math.max(0, prev.food - 1),
          health: prev.health,
        };

        // Health decreases if any resource is depleted
        if (newResources.energy === 0 || newResources.water === 0 || newResources.food === 0) {
          newResources.health = Math.max(0, prev.health - 5);
          addMessage("Warning: Critical resource levels!");
        }

        if (newResources.health === 0) {
          setGameOver(true);
          addMessage("Game Over: You didn't survive!");
        }

        return newResources;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    if (gameOver) return;

    const dayInterval = setInterval(() => {
      setDay(prev => prev + 1);
      addMessage(`Day ${day + 1} has begun`);
    }, 10000);

    return () => clearInterval(dayInterval);
  }, [gameOver, day]);

  const gatherResources = (type: keyof Resources) => {
    if (gameOver) return;

    setResources(prev => ({
      ...prev,
      [type]: Math.min(100, prev[type] + 20),
    }));
    addMessage(`Gathered ${type}`);
  };

  const restartGame = () => {
    setResources({
      energy: 100,
      water: 100,
      food: 100,
      health: 100,
    });
    setDay(1);
    setGameOver(false);
    setMessages([]);
    addMessage("New game started!");
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Silver Moon Survival</h1>
          <p className="text-gray-400">Day {day}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Battery className="text-yellow-400" />
              <span>Energy</span>
            </div>
            <div className="h-2 bg-gray-700 rounded">
              <div
                className="h-full bg-yellow-400 rounded"
                style={{ width: `${resources.energy}%` }}
              />
            </div>
            <button
              onClick={() => gatherResources('energy')}
              className="mt-2 w-full bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded"
              disabled={gameOver}
            >
              Gather Energy
            </button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Droplet className="text-blue-400" />
              <span>Water</span>
            </div>
            <div className="h-2 bg-gray-700 rounded">
              <div
                className="h-full bg-blue-400 rounded"
                style={{ width: `${resources.water}%` }}
              />
            </div>
            <button
              onClick={() => gatherResources('water')}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
              disabled={gameOver}
            >
              Gather Water
            </button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Sun className="text-green-400" />
              <span>Food</span>
            </div>
            <div className="h-2 bg-gray-700 rounded">
              <div
                className="h-full bg-green-400 rounded"
                style={{ width: `${resources.food}%` }}
              />
            </div>
            <button
              onClick={() => gatherResources('food')}
              className="mt-2 w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              disabled={gameOver}
            >
              Gather Food
            </button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Heart className="text-red-400" />
              <span>Health</span>
            </div>
            <div className="h-2 bg-gray-700 rounded">
              <div
                className="h-full bg-red-400 rounded"
                style={{ width: `${resources.health}%` }}
              />
            </div>
          </div>
        </div>

        {gameOver && (
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 text-red-500 mb-4">
              <AlertTriangle />
              <h2 className="text-2xl font-bold">Game Over</h2>
            </div>
            <button
              onClick={restartGame}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg"
            >
              Restart Game
            </button>
          </div>
        )}

        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Log</h3>
          <div className="space-y-2">
            {messages.map((message, index) => (
              <p key={index} className="text-gray-400">
                {message}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;