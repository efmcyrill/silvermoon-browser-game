import * as THREE from 'three';
import * as PIXI from 'pixi.js';
import { Howl } from 'howler';
import { WEAPONS, ALIENS } from './gameData';
import { AssetLoader } from './utils/assetLoader';

export class Game {
    private app: PIXI.Application;
    private gameContainer: PIXI.Container;
    private uiContainer: PIXI.Container;
    private effectsContainer: PIXI.Container;
    private astronauts: PIXI.Container[] = [];
    private aliens: PIXI.Container[] = [];
    private projectiles: PIXI.Sprite[] = [];
    private spawnPoints: PIXI.Point[] = [];
    private gameStarted: boolean = false;
    private wave: number = 0;
    private level: number = 1;
    private score: number = 0;
    private lastFired: { [key: string]: number } = {};
    private sounds: Map<string, Howl>;
    private textures: Map<string, THREE.Texture>;
    private isPaused: boolean = false;
    private selectedAstronaut: PIXI.Container | null = null;
    private isDragging: boolean = false;
    private dragStartPosition: PIXI.Point | null = null;
    private dragRotation: number = 0;

    constructor(container: HTMLElement) {
        this.app = new PIXI.Application({
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: 0x1a1a1a,
            resolution: window.devicePixelRatio || 1,
            antialias: true
        });
        container.appendChild(this.app.view as HTMLCanvasElement);

        this.gameContainer = new PIXI.Container();
        this.uiContainer = new PIXI.Container();
        this.effectsContainer = new PIXI.Container();

        this.app.stage.addChild(this.gameContainer);
        this.app.stage.addChild(this.effectsContainer);
        this.app.stage.addChild(this.uiContainer);

        // Initialize empty maps
        this.sounds = new Map();
        this.textures = new Map();

        this.init();
    }

    private async init() {
        try {
            // Load assets
            [this.sounds, this.textures] = await Promise.all([
                AssetLoader.loadSounds(),
                AssetLoader.loadTextures()
            ]);

            this.createMoonSurface();
            this.setupUI();
            this.setupEventListeners();
            this.createInitialAstronauts();

            this.app.ticker.add(() => this.update());
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }

    private createInitialAstronauts() {
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
            astronaut.interactive = true;
            astronaut.buttonMode = true;
            this.astronauts.push(astronaut);
            this.gameContainer.addChild(astronaut);
        });
    }

    private createAstronaut(weapon: typeof WEAPONS[keyof typeof WEAPONS]) {
        const astronaut = new PIXI.Container();
        astronaut.interactive = true;
        astronaut.buttonMode = true;

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

        return astronaut;
    }

    private createWeaponRangeIndicator(weapon: typeof WEAPONS[keyof typeof WEAPONS]) {
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

    private onMouseDown = (event: MouseEvent) => {
        const position = new PIXI.Point(event.offsetX, event.offsetY);
        const astronaut = this.astronauts.find(a => a.getBounds().contains(position.x, position.y));

        if (astronaut) {
            this.selectedAstronaut = astronaut;
            this.isDragging = true;
            this.dragStartPosition = position.clone();
            this.dragRotation = astronaut.rotation;
            
            if (event.detail === 2) { // Double click
                this.openAstronautMenu(astronaut);
            }
        }
    }

    private onMouseMove = (event: MouseEvent) => {
        if (this.isDragging && this.selectedAstronaut && this.dragStartPosition) {
            const position = new PIXI.Point(event.offsetX, event.offsetY);
            
            if (event.shiftKey) {
                // Rotate astronaut
                const angle = Math.atan2(
                    position.y - this.selectedAstronaut.position.y,
                    position.x - this.selectedAstronaut.position.x
                );
                this.selectedAstronaut.rotation = angle;
            } else {
                // Move astronaut
                this.selectedAstronaut.position.copyFrom(position);
            }
        }
    }

    private onMouseUp = () => {
        this.isDragging = false;
        this.selectedAstronaut = null;
        this.dragStartPosition = null;
    }

    private setupEventListeners() {
        if (this.app.view instanceof HTMLCanvasElement) {
            this.app.view.addEventListener('mousedown', this.onMouseDown);
            this.app.view.addEventListener('mousemove', this.onMouseMove);
            this.app.view.addEventListener('mouseup', this.onMouseUp);
            this.app.view.addEventListener('contextmenu', (e) => e.preventDefault());
        }
    }

    private setupUI() {
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
            'Drag to move astronauts\nHold Shift + Drag to rotate\nDouble-click for menu',
            { ...style, fontSize: 18 }
        );
        instructions.position.set(10, this.app.screen.height - 80);
        this.uiContainer.addChild(instructions);
    }

    public startGame() {
        this.gameStarted = true;
        this.level = 1;
        this.score = 0;
        this.wave = 0;
        this.spawnAlienWave();
    }

    private update() {
        if (!this.gameStarted || this.isPaused) return;

        // Update game logic here
        this.updateProjectiles();
        this.updateAliens();
    }

    // ... [Rest of the methods remain the same]
}