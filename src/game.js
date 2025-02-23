import * as PIXI from 'pixi.js';
import { WEAPONS, ALIENS } from './gameData';

export class Game {
    constructor(container) {
        this.container = container;
        this.app = new PIXI.Application({
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: 0x1a1a1a,
            resolution: window.devicePixelRatio || 1,
            antialias: true,
            autoDensity: true,
        });
        container.appendChild(this.app.view);

        // Initialize game properties
        this.astronauts = [];
        this.aliens = [];
        this.projectiles = [];
        this.spawnPoints = [];
        this.gameStarted = false;
        this.wave = 0;
        this.level = 1;
        this.score = 0;
        this.lastFired = {};
        this.isDragging = false;
        this.selectedAstronaut = null;
        this.dragOffset = null;

        // Create game containers
        this.gameContainer = new PIXI.Container();
        this.uiContainer = new PIXI.Container();
        this.effectsContainer = new PIXI.Container();

        this.app.stage.addChild(this.gameContainer);
        this.app.stage.addChild(this.effectsContainer);
        this.app.stage.addChild(this.uiContainer);

        this.init();
    }

    init() {
        this.createMoonSurface();
        this.setupUI();
        this.createInitialAstronauts();
        this.setupEventListeners();

        // Start the game loop
        this.app.ticker.add(() => this.update());
    }

    createMoonSurface() {
        const surface = new PIXI.Graphics();
        surface.beginFill(0x333333);
        surface.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        surface.endFill();
        
        // Add some random craters
        for (let i = 0; i < 50; i++) {
            const crater = new PIXI.Graphics();
            crater.beginFill(0x222222);
            const size = Math.random() * 20 + 10;
            crater.drawCircle(
                Math.random() * this.app.screen.width,
                Math.random() * this.app.screen.height,
                size
            );
            crater.endFill();
            surface.addChild(crater);
        }
        
        this.gameContainer.addChild(surface);
    }

    createInitialAstronauts() {
        const weapons = [WEAPONS.RIFLE, WEAPONS.PLASMA, WEAPONS.FLAMETHROWER, WEAPONS.RAILGUN];
        const positions = [
            { x: 100, y: 200 },
            { x: 100, y: 300 },
            { x: 100, y: 400 },
            { x: 100, y: 500 }
        ];

        weapons.forEach((weapon, index) => {
            const astronaut = this.createAstronaut(weapon);
            astronaut.position.copyFrom(positions[index]);
            this.astronauts.push(astronaut);
            this.gameContainer.addChild(astronaut);
        });
    }

    createAstronaut(weapon) {
        const astronaut = new PIXI.Container();
        
        // Make astronaut interactive
        astronaut.eventMode = 'static';
        astronaut.cursor = 'pointer';

        // Body
        const body = new PIXI.Graphics();
        body.beginFill(0xffffff);
        body.drawCircle(0, 0, 20);
        body.endFill();
        astronaut.addChild(body);

        // Weapon
        const weaponGraphics = new PIXI.Graphics();
        weaponGraphics.beginFill(weapon.color);
        weaponGraphics.drawRect(0, -5, 30, 10);
        weaponGraphics.endFill();
        weaponGraphics.position.set(20, 0);
        astronaut.addChild(weaponGraphics);

        // Range indicator
        const rangeIndicator = this.createWeaponRangeIndicator(weapon);
        astronaut.addChild(rangeIndicator);

        // Store weapon data
        astronaut.weapon = weapon;
        astronaut.health = 100;

        // Add drag and drop functionality
        astronaut
            .on('pointerdown', this.onDragStart.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('pointermove', this.onDragMove.bind(this));

        return astronaut;
    }

    createWeaponRangeIndicator(weapon) {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(2, weapon.color, 0.3);
        graphics.beginFill(weapon.color, 0.1);
        
        const angleRad = (weapon.angle * Math.PI) / 180;
        const radius = weapon.range;
        const points = [];
        
        points.push(0, 0);
        for (let i = -angleRad; i <= angleRad; i += angleRad / 10) {
            points.push(
                Math.cos(i) * radius,
                Math.sin(i) * radius
            );
        }
        
        graphics.drawPolygon(points);
        graphics.endFill();
        
        return graphics;
    }

    onDragStart(event) {
        const astronaut = event.currentTarget;
        astronaut.alpha = 0.8;
        this.selectedAstronaut = astronaut;
        this.isDragging = true;
        
        // Store the offset between pointer position and astronaut position
        const globalPoint = event.global.clone();
        this.dragOffset = {
            x: globalPoint.x - astronaut.x,
            y: globalPoint.y - astronaut.y
        };
    }

    onDragMove(event) {
        if (this.isDragging && this.selectedAstronaut) {
            const newPosition = event.global;
            
            if (event.originalEvent.shiftKey) {
                // Rotate astronaut
                const dx = newPosition.x - this.selectedAstronaut.x;
                const dy = newPosition.y - this.selectedAstronaut.y;
                this.selectedAstronaut.rotation = Math.atan2(dy, dx);
            } else {
                // Move astronaut
                this.selectedAstronaut.x = newPosition.x - this.dragOffset.x;
                this.selectedAstronaut.y = newPosition.y - this.dragOffset.y;
            }
        }
    }

    onDragEnd() {
        if (this.selectedAstronaut) {
            this.selectedAstronaut.alpha = 1;
            this.selectedAstronaut = null;
            this.isDragging = false;
            this.dragOffset = null;
        }
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        if (this.app && this.container) {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            
            this.app.renderer.resize(width, height);
            this.updateUI(); // Refresh UI positions
        }
    }

    setupUI() {
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff
        });

        const scoreText = new PIXI.Text(`Score: ${this.score}`, style);
        scoreText.position.set(10, 10);
        this.uiContainer.addChild(scoreText);

        const levelText = new PIXI.Text(`Level ${this.level} - Wave ${this.wave}/3`, style);
        levelText.position.set(10, 40);
        this.uiContainer.addChild(levelText);

        const instructions = new PIXI.Text(
            'Drag to move astronauts\nHold Shift + Drag to rotate',
            { ...style, fontSize: 18 }
        );
        instructions.position.set(10, this.app.screen.height - 60);
        this.uiContainer.addChild(instructions);
    }

    updateUI() {
        // Clear existing UI
        this.uiContainer.removeChildren();
        // Recreate UI with updated positions
        this.setupUI();
    }

    update() {
        if (!this.gameStarted) return;

        // Update game logic here
        this.updateProjectiles();
        this.updateAliens();
    }

    updateProjectiles() {
        // Implement projectile updates
    }

    updateAliens() {
        // Implement alien updates
    }

    startGame() {
        this.gameStarted = true;
        this.level = 1;
        this.score = 0;
        this.wave = 0;
    }
}