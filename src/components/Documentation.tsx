import React from 'react';

function Documentation() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-blue-400">Game Documentation</h1>
      
      <div className="prose prose-invert max-w-none">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-300">Game Overview</h2>
          <p className="text-gray-300">
            Silver Moon Survival is a strategic defense game where you must protect your 
            crashed spaceship while repairs are being made. Position your astronauts 
            strategically and survive waves of alien attacks.
          </p>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-300">Controls</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Drag astronauts to position them (before wave starts or during pause)</li>
            <li>Hold Shift + Drag to rotate astronauts</li>
            <li>Ctrl/Cmd + Click astronaut to view stats</li>
            <li>Press Pause to adjust positions mid-game</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-300">Weapons</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(WEAPONS).map(([key, weapon]) => (
              <div key={key} className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-2">{weapon.name}</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>Damage: {weapon.damage}</li>
                  <li>Range: {weapon.range}</li>
                  <li>Fire Rate: {weapon.fireRate}/s</li>
                  <li>Firing Arc: {weapon.angle}°</li>
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-300">Enemies</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(ALIENS).map(([key, alien]) => (
              <div key={key} className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold mb-2">{alien.name}</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>Health: {alien.health}</li>
                  <li>Speed: {alien.speed}</li>
                  <li>Armor: {(1 - alien.armor) * 100}% damage taken</li>
                  <li>Points: {alien.points}</li>
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 text-blue-300">Scoring System</h2>
          <p className="text-gray-300 mb-4">
            Each level has a target score that must be achieved to progress. The target 
            is set at 90% of the maximum possible score for the wave. Points are awarded 
            for each alien defeated:
          </p>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Runner: 100 points</li>
            <li>Sprinter: 200 points</li>
            <li>Tank: 300 points</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4 text-blue-300">Tips & Strategies</h2>
          <ul className="list-disc list-inside text-gray-300 space-y-2">
            <li>Position Railgun users at the back for maximum range</li>
            <li>Use Flamethrowers near chokepoints</li>
            <li>Plasma Guns are effective against groups</li>
            <li>Focus fire on Tanks before they get too close</li>
            <li>Don't let Sprinters slip through - they're fast!</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

export default Documentation;