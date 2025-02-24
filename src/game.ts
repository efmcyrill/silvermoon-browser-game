import * as PIXI from 'pixi.js';
import { WEAPONS, ALIENS } from './gameData';

interface Astronaut extends PIXI.Container {
  weapon: typeof WEAPONS[keyof typeof WEAPONS];
  health: number;
  lastFired: number;
  baseRotation: number;
}

interface Alien extends PIXI.Container {
  type: typeof ALIENS[keyof typeof ALIENS];
  health: number;
  velocity: { x: number; y: number };
}

interface Projectile extends PIXI.Graphics {
  velocity: { x: number; y: number };
  weapon: typeof WEAPONS[keyof typeof WEAPONS];
  distance: number;
}

interface Target {
  alien: Alien;
  angle: number;
  distance: number;
}

export class Game {
    private container: HTMLElement;
    private app: PIXI.Application;
    private gameContainer: PIXI.Container;
    private uiContainer: PIXI.Container;
    private effectsContainer: PIXI.Container;
    private astronauts: Astronaut[] = [];
    private aliens: Alien[] = [];
    private projectiles: Projectile[] = [];
    private spawnPoints: PIXI.Point[] = [];
    private gameStarted: boolean = false;
    private isPaused: boolean = false;
    private wave: number = 0;
    private level: number = 1;
    private score: number = 0;
    private targetScore: number = 0;
    private waveAlienCount: number = 0;
    private aliensKilled: number = 0;
    private lastFired: { [key: string]: number } = {};
    private isDragging: boolean = false;
    private selectedAstronaut: Astronaut | null = null;
    private dragOffset: { x: number; y: number } | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.app = new PIXI.Application({
            width: container.clientWidth,
            height: container.clientHeight,
            backgroundColor: 0x1a1a1a,
            resolution: window.devicePixelRatio || 1,
            antialias: true,
            autoDensity: true,
        });
        container.appendChild(this.app.view as HTMLCanvasElement);

        this.gameContainer = new PIXI.Container();
        this.uiContainer = new PIXI.Container();
        this.effectsContainer = new PIXI.Container();

        this.app.stage.addChild(this.gameContainer);
        this.app.stage.addChild(this.effectsContainer);
        this.app.stage.addChild(this.uiContainer);

        this.init();
    }

    private init(): void {
        this.createMoonSurface();
        this.createSpaceship();
        this.setupUI();
        this.createInitialAstronauts();
        this.setupEventListeners();

        this.app.ticker.add((delta) => this.update(delta));
    }

    private createMoonSurface(): void {
        const surface = new PIXI.Graphics();
        surface.beginFill(0x333333);
        surface.drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        surface.endFill();
        
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

    private createSpaceship(): void {
        const spaceship = new PIXI.Container();
        
        const body = new PIXI.Graphics();
        body.beginFill(0x444444);
        body.drawRect(0, 0, 120, 300);
        body.endFill();
        
        for (let i = 0; i < 3; i++) {
            const window = new PIXI.Graphics();
            window.beginFill(0x88ccff);
            window.drawCircle(60, 50 + i * 80, 15);
            window.endFill();
            body.addChild(window);
        }
        
        const engine1 = new PIXI.Graphics();
        engine1.beginFill(0x666666);
        engine1.drawRect(20, 300, 30, 40);
        engine1.endFill();
        
        const engine2 = new PIXI.Graphics();
        engine2.beginFill(0x666666);
        engine2.drawRect(70, 300, 30, 40);
        engine2.endFill();
        
        spaceship.addChild(body, engine1, engine2);
        spaceship.position.set(50, this.app.screen.height / 2 - 150);
        this.gameContainer.addChild(spaceship);
    }

    private createInitialAstronauts(): void {
        const weapons = [WEAPONS.RIFLE, WEAPONS.PLASMA, WEAPONS.FLAMETHROWER, WEAPONS.RAILGUN];
        const positions = [
            { x: 200, y: 200 },
            { x: 200, y: 300 },
            { x: 200, y: 400 },
            { x: 200, y: 500 }
        ];

        weapons.forEach((weapon, index) => {
            const astronaut = this.createAstronaut(weapon);
            astronaut.position.copyFrom(positions[index]);
            this.astronauts.push(astronaut);
            this.gameContainer.addChild(astronaut);
        });
    }

    private createAstronaut(weapon: typeof WEAPONS[keyof typeof WEAPONS]): Astronaut {
        const astronaut = new PIXI.Container() as Astronaut;
        astronaut.eventMode = 'static';
        astronaut.cursor = 'pointer';

        const body = new PIXI.Graphics();
        body.beginFill(0xffffff);
        body.drawCircle(0, 0, 20);
        body.endFill();
        astronaut.addChild(body);

        const weaponGraphics = new PIXI.Graphics();
        weaponGraphics.beginFill(weapon.color);
        weaponGraphics.drawRect(0, -5, 30, 10);
        weaponGraphics.endFill();
        weaponGraphics.position.set(20, 0);
        astronaut.addChild(weaponGraphics);

        const rangeIndicator = this.createWeaponRangeIndicator(weapon);
        astronaut.addChild(rangeIndicator);

        astronaut.weapon = weapon;
        astronaut.health = 100;
        astronaut.lastFired = 0;
        astronaut.baseRotation = 0;

        astronaut
            .on('pointerdown', this.onAstronautClick.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('pointermove', this.onDragMove.bind(this));

        return astronaut;
    }

    private onAstronautClick(event: PIXI.FederatedPointerEvent): void {
        const astronaut = event.currentTarget as Astronaut;
        
        if (this.gameStarted && !this.isPaused) return;
        
        if (event.data.originalEvent instanceof MouseEvent && 
            (event.data.originalEvent.ctrlKey || event.data.originalEvent.metaKey)) {
            this.showAstronautMenu(astronaut);
        } else {
            this.onDragStart(event);
        }
    }

    private onDragStart(event: PIXI.FederatedPointerEvent): void {
        if (this.gameStarted && !this.isPaused) return;
        
        const astronaut = event.currentTarget as Astronaut;
        astronaut.alpha = 0.8;
        this.selectedAstronaut = astronaut;
        this.isDragging = true;
        
        const globalPoint = event.global.clone();
        this.dragOffset = {
            x: globalPoint.x - astronaut.x,
            y: globalPoint.y - astronaut.y
        };
    }

    private onDragMove(event: PIXI.FederatedPointerEvent): void {
        if (this.isDragging && this.selectedAstronaut && this.dragOffset) {
            const newPosition = event.global;
            
            if (event.data.originalEvent instanceof MouseEvent && event.data.originalEvent.shiftKey) {
                const dx = newPosition.x - this.selectedAstronaut.x;
                const dy = newPosition.y - this.selectedAstronaut.y;
                const newRotation = Math.atan2(dy, dx);
                this.selectedAstronaut.baseRotation = newRotation;
                this.selectedAstronaut.rotation = newRotation;
            } else {
                this.selectedAstronaut.x = newPosition.x - this.dragOffset.x;
                this.selectedAstronaut.y = newPosition.y - this.dragOffset.y;
                
                this.selectedAstronaut.x = Math.max(200, Math.min(this.app.screen.width - 20, this.selectedAstronaut.x));
                this.selectedAstronaut.y = Math.max(20, Math.min(this.app.screen.height - 20, this.selectedAstronaut.y));
            }
        }
    }

    private onDragEnd(): void {
        if (this.selectedAstronaut) {
            this.selectedAstronaut.alpha = 1;
            this.selectedAstronaut = null;
            this.isDragging = false;
            this.dragOffset = null;
        }
    }

    private setupEventListeners(): void {
        window.addEventListener('resize', () => this.resize());
    }

    private resize(): void {
        if (this.app && this.container) {
            const width = this.container.clientWidth;
            const height = this.container.clientHeight;
            
            this.app.renderer.resize(width, height);
            this.updateUI();
        }
    }

    private createWeaponRangeIndicator(weapon: typeof WEAPONS[keyof typeof WEAPONS]): PIXI.Graphics {
        const graphics = new PIXI.Graphics();
        graphics.lineStyle(2, weapon.color, 0.3);
        graphics.beginFill(weapon.color, 0.1);
        
        const angleRad = (weapon.angle * Math.PI) / 180;
        const radius = weapon.range;
        const points: number[] = [];
        
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

    private setupUI(): void {
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff
        });

        const scoreText = new PIXI.Text(`Score: ${this.score}/${this.targetScore}`, style);
        scoreText.position.set(10, 10);
        this.uiContainer.addChild(scoreText);

        const waveText = new PIXI.Text(`Wave ${this.wave}/3`, style);
        waveText.position.set(10, 40);
        this.uiContainer.addChild(waveText);

        const levelText = new PIXI.Text(`Level ${this.level}`, style);
        levelText.position.set(10, 70);
        this.uiContainer.addChild(levelText);
    }

    public startGame(): void {
        this.gameStarted = true;
        this.isPaused = false;
        this.level = 1;
        this.score = 0;
        this.wave = 0;
        this.spawnAlienWave();
    }

    private findTargetsInRange(astronaut: Astronaut): Target[] {
        const targets: Target[] = [];
        const astronautPos = astronaut.position;

        for (const alien of this.aliens) {
            const dx = alien.x - astronautPos.x;
            const dy = alien.y - astronautPos.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx);

            // Convert angle to degrees and normalize to 0-360 range
            let angleDeg = (angle * 180 / Math.PI) % 360;
            if (angleDeg < 0) angleDeg += 360;

            // Calculate the base angle of the astronaut in degrees
            let baseAngleDeg = (astronaut.baseRotation * 180 / Math.PI) % 360;
            if (baseAngleDeg < 0) baseAngleDeg += 360;

            // Calculate the angle difference
            let angleDiff = Math.abs(angleDeg - baseAngleDeg);
            if (angleDiff > 180) angleDiff = 360 - angleDiff;

            // Check if target is within weapon's range and angle
            if (distance <= astronaut.weapon.range && angleDiff <= astronaut.weapon.angle) {
                targets.push({ alien, angle, distance });
            }
        }

        // Sort targets by distance
        return targets.sort((a, b) => a.distance - b.distance);
    }

    private updateAstronautRotation(astronaut: Astronaut): void {
        const targets = this.findTargetsInRange(astronaut);
        if (targets.length > 0) {
            // Rotate towards the nearest target within angle constraints
            const target = targets[0];
            let targetAngle = target.angle;

            // Calculate the allowed angle range
            const baseAngle = astronaut.baseRotation;
            const maxAngleRad = (astronaut.weapon.angle * Math.PI) / 180;
            const minAllowedAngle = baseAngle - maxAngleRad;
            const maxAllowedAngle = baseAngle + maxAngleRad;

            // Clamp the target angle within the allowed range
            if (targetAngle < minAllowedAngle) {
                targetAngle = minAllowedAngle;
            } else if (targetAngle > maxAllowedAngle) {
                targetAngle = maxAllowedAngle;
            }

            // Smoothly rotate towards the target
            const rotationSpeed = 0.1;
            const angleDiff = targetAngle - astronaut.rotation;
            astronaut.rotation += angleDiff * rotationSpeed;
        }
    }

    private update(delta: number): void {
        if (!this.gameStarted || this.isPaused) return;

        // Update astronaut rotations and targeting
        this.astronauts.forEach(astronaut => {
            this.updateAstronautRotation(astronaut);
            
            // Only shoot if there are targets in range
            const targets = this.findTargetsInRange(astronaut);
            if (targets.length > 0 && 
                Date.now() - astronaut.lastFired >= 1000 / astronaut.weapon.fireRate) {
                this.createProjectile(astronaut, targets[0].alien);
                astronaut.lastFired = Date.now();
            }
        });

        this.updateProjectiles(delta);
        this.updateAliens(delta);
        this.checkWaveCompletion();
    }

    private updateAliens(delta: number): void {
        this.aliens.forEach(alien => {
            alien.x -= alien.type.speed * delta;
            if (alien.x < -50) {
                this.removeAlien(alien);
            }
        });
    }

    private updateProjectiles(delta: number): void {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            projectile.x += projectile.velocity.x * delta;
            projectile.y += projectile.velocity.y * delta;
            
            projectile.distance += Math.sqrt(
                projectile.velocity.x * projectile.velocity.x +
                projectile.velocity.y * projectile.velocity.y
            ) * delta;
            
            if (projectile.distance > projectile.weapon.range) {
                this.removeProjectile(projectile);
                continue;
            }
            
            this.checkProjectileCollisions(projectile);
        }
    }

    private createProjectile(astronaut: Astronaut, target: Alien): void {
        const projectile = new PIXI.Graphics() as Projectile;
        projectile.beginFill(astronaut.weapon.color);
        projectile.drawCircle(0, 0, 4);
        projectile.endFill();
        
        projectile.position.copyFrom(astronaut.position);
        
        const dx = target.x - astronaut.x;
        const dy = target.y - astronaut.y;
        const angle = Math.atan2(dy, dx);
        
        const speed = 10;
        projectile.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        
        projectile.weapon = astronaut.weapon;
        projectile.distance = 0;
        
        this.projectiles.push(projectile);
        this.gameContainer.addChild(projectile);
    }

    private removeProjectile(projectile: Projectile): void {
        const index = this.projectiles.indexOf(projectile);
        if (index !== -1) {
            this.projectiles.splice(index, 1);
            this.gameContainer.removeChild(projectile);
        }
    }

    private removeAlien(alien: Alien): void {
        const index = this.aliens.indexOf(alien);
        if (index !== -1) {
            this.aliens.splice(index, 1);
            this.gameContainer.removeChild(alien);
            this.aliensKilled++;
            this.updateUI();
        }
    }

    private checkProjectileCollisions(projectile: Projectile): void {
        for (const alien of this.aliens) {
            const dx = projectile.x - alien.x;
            const dy = projectile.y - alien.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < alien.type.size.width * 20) {
                alien.health -= projectile.weapon.damage * alien.type.armor;
                this.removeProjectile(projectile);
                
                if (alien.health <= 0) {
                    this.score += 100;
                    this.removeAlien(alien);
                }
                break;
            }
        }
    }

    private checkWaveCompletion(): void {
        if (this.aliens.length === 0) {
            if (this.wave < 3) {
                this.spawnAlienWave();
            } else {
                this.checkLevelCompletion();
            }
        }
    }

    private spawnAlienWave(): void {
        this.wave++;
        const waveSize = Math.min(3 + this.level + this.wave, 15);
        this.waveAlienCount = waveSize;
        this.aliensKilled = 0;
        
        for (let i = 0; i < waveSize; i++) {
            const types = Object.values(ALIENS);
            const type = types[Math.floor(Math.random() * types.length)];
            
            const alien = this.createAlien(type);
            alien.position.set(
                this.app.screen.width + 50,
                Math.random() * (this.app.screen.height - 100) + 50
            );
            
            this.aliens.push(alien);
            this.gameContainer.addChild(alien);
        }
        
        this.targetScore = this.calculateWaveTargetScore();
        this.updateUI();
    }

    private createAlien(type: typeof ALIENS[keyof typeof ALIENS]): Alien {
        const alien = new PIXI.Container() as Alien;
        
        const body = new PIXI.Graphics();
        body.beginFill(type.color);
        body.drawRect(-type.size.width/2, -type.size.height/2, 
                     type.size.width * 40, type.size.height * 40);
        body.endFill();
        alien.addChild(body);
        
        alien.type = type;
        alien.health = type.health;
        alien.velocity = { x: 0, y: 0 };
        
        return alien;
    }

    private calculateWaveTargetScore(): number {
        const waveSize = Math.min(3 + this.level + this.wave, 15);
        return waveSize * 100;
    }

    private checkLevelCompletion(): void {
        if (this.score >= this.targetScore) {
            this.level++;
            this.wave = 0;
            this.spawnAlienWave();
        } else {
            this.gameOver();
        }
    }

    private gameOver(): void {
        this.gameStarted = false;
        this.showGameOver();
    }

    private showGameOver(): void {
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xffffff,
            stroke: 0x000000,
            strokeThickness: 4
        });
        
        const text = new PIXI.Text('Game Over!', style);
        text.anchor.set(0.5);
        text.position.set(this.app.screen.width/2, this.app.screen.height/2);
        
        this.uiContainer.addChild(text);
    }
}