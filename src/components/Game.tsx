import React from 'react';
import AdUnit from './AdUnit';

function Game() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 text-blue-400">Silver Moon Survival</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          A desperate quest for survival! Your spaceship has crash-landed on a hostile moon, 
          and your crew must defend the perimeter while critical repairs are made. Position 
          your astronauts strategically, manage your resources, and hold out against waves 
          of alien attackers until help arrives.
        </p>
      </div>

      <div className="game-container bg-gray-800 rounded-lg shadow-2xl p-4 mb-12 mx-auto relative" style={{ width: '95%' }}>
        <div id="gameCanvas" className="h-full rounded-lg"></div>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdUnit />
        <AdUnit />
        <AdUnit />
      </div>
    </div>
  );
}

export default Game;