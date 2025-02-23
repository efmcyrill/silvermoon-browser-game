export const WEAPONS = {
    PISTOL: {
        name: 'Pistol',
        damage: 25,
        range: 30,
        fireRate: 1,
        color: 0x666666,
        size: { length: 0.3, width: 0.08 },
        angle: 5
    },
    RIFLE: {
        name: 'Rifle',
        damage: 40,
        range: 50,
        fireRate: 2,
        color: 0x444444,
        size: { length: 0.5, width: 0.1 },
        angle: 10
    },
    PLASMA: {
        name: 'Plasma Gun',
        damage: 60,
        range: 40,
        fireRate: 1.5,
        color: 0x00ff00,
        size: { length: 0.4, width: 0.12 },
        angle: 15
    },
    FLAMETHROWER: {
        name: 'Flamethrower',
        damage: 80,
        range: 20,
        fireRate: 3,
        color: 0xff4400,
        size: { length: 0.45, width: 0.15 },
        angle: 30
    },
    RAILGUN: {
        name: 'Rail Gun',
        damage: 100,
        range: 60,
        fireRate: 0.5,
        color: 0x0066ff,
        size: { length: 0.6, width: 0.1 },
        angle: 5
    }
};

export const ALIENS = {
    RUNNER: {
        name: 'Runner',
        health: 50,
        speed: 2,
        armor: 0.8,
        color: 0xff0000,
        size: { width: 0.4, height: 0.4 }
    },
    TANK: {
        name: 'Tank',
        health: 200,
        speed: 0.5,
        armor: 0.4,
        color: 0x880000,
        size: { width: 0.8, height: 0.8 }
    },
    SPRINTER: {
        name: 'Sprinter',
        health: 30,
        speed: 3,
        armor: 0.9,
        color: 0xff6600,
        size: { width: 0.3, height: 0.3 }
    }
};