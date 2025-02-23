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
        this.isPaused = false;
        this.wave = 0;
        this.level = 1;
        this.score = 0;
        this.targetScore = 0;
        this.waveAlienCount = 0;
        this.aliensKilled = 0;
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
        this.createSpaceship();
        this.setupUI();
        this.createInitialAstronauts();
        this.setupEventListeners();

        // Start the game loop
        this.app.ticker.add((delta) => this.update(delta));
    }

    createSpaceship() {
        const spaceship = new PIXI.Container();
        
        // Main body
        const body = new PIXI.Graphics();
        body.beginFill(0x444444);
        body.drawRect(0, 0, 120, 300);
        body.endFill();
        
        // Windows
        for (let i = 0; i < 3; i++) {
            const window = new PIXI.Graphics();
            window.beginFill(0x88ccff);
            window.drawCircle(60, 50 + i * 80, 15);
            window.endFill();
            body.addChild(window);
        }
        
        // Engines
        const engine1 = new PIXI.Graphics();
        engine1.beginFill(0x666666);
        engine1.drawRect(20, 300, 30, 40);
        engine1.endFill();
        
        const engine2 = new PIXI.Graphics();
        engine2.beginFill(0x666666);
        engine2.drawRect(70, 300, 30, 40);
        engine2.endFill();
        
        spaceship.addChild(body);
        spaceship.addChild(engine1);
        spaceship.addChild(engine2);
        
        spaceship.position.set(50, this.app.screen.height / 2 - 150);
        this.gameContainer.addChild(spaceship);
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
        astronaut.lastFired = 0;

        // Add event listeners
        astronaut
            .on('pointerdown', this.onAstronautClick.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('pointermove', this.onDragMove.bind(this));

        return astronaut;
    }

    onAstronautClick(event) {
        const astronaut = event.currentTarget;
        
        if (this.gameStarted && !this.isPaused) return;
        
        if (event.data.originalEvent.ctrlKey || event.data.originalEvent.metaKey) {
            this.showAstronautMenu(astronaut);
        } else {
            this.onDragStart(event);
        }
    }

    showAstronautMenu(astronaut) {
        // Remove any existing menu
        const existingMenu = this.uiContainer.getChildByName('astronautMenu');
        if (existingMenu) {
            this.uiContainer.removeChild(existingMenu);
        }

        const menu = new PIXI.Container();
        menu.name = 'astronautMenu';
        
        // Background
        const bg = new PIXI.Graphics();
        bg.beginFill(0x333333, 0.9);
        bg.drawRoundedRect(0, 0, 200, 180, 10);
        bg.endFill();
        menu.addChild(bg);

        // Title
        const titleStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        const title = new PIXI.Text(`Astronaut Stats`, titleStyle);
        title.position.set(10, 10);
        menu.addChild(title);

        // Stats
        const statsStyle = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xffffff
        });

        const stats = [
            `Weapon: ${astronaut.weapon.name}`,
            `Damage: ${astronaut.weapon.damage}`,
            `Range: ${astronaut.weapon.range}`,
            `Fire Rate: ${astronaut.weapon.fireRate}/s`,
            `Health: ${astronaut.health}%`
        ];

        stats.forEach((stat, index) => {
            const text = new PIXI.Text(stat, statsStyle);
            text.position.set(10, 40 + index * 25);
            menu.addChild(text);
        });

        // Position menu near astronaut but within screen bounds
        menu.position.set(
            Math.min(astronaut.x + 50, this.app.screen.width - 220),
            Math.min(astronaut.y - 50, this.app.screen.height - 200)
        );

        // Close button
        const closeBtn = this.createButton('Close', 50, 150, () => {
            this.uiContainer.removeChild(menu);
        });
        closeBtn.scale.set(0.8);
        menu.addChild(closeBtn);

        this.uiContainer.addChild(menu);
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

    createProgressBar(x, y, width, height, value, maxValue, color = 0x00ff00) {
        const container = new PIXI.Container();
        
        // Background
        const bg = new PIXI.Graphics();
        bg.beginFill(0x333333);
        bg.drawRoundedRect(0, 0, width, height, height / 2);
        bg.endFill();
        container.addChild(bg);
        
        // Progress
        const progress = new PIXI.Graphics();
        progress.beginFill(color);
        const progressWidth = Math.max(0, Math.min(1, value / maxValue)) * width;
        progress.drawRoundedRect(0, 0, progressWidth, height, height / 2);
        progress.endFill();
        container.addChild(progress);
        
        container.position.set(x, y);
        return container;
    }

    createProjectile(astronaut) {
        if (this.isPaused) return;
        
        const now = Date.now();
        if (now - astronaut.lastFired < 1000 / astronaut.weapon.fireRate) return;
        
        astronaut.lastFired = now;
        
        const projectile = new PIXI.Graphics();
        projectile.beginFill(astronaut.weapon.color);
        projectile.drawCircle(0, 0, 4);
        projectile.endFill();
        
        projectile.position.copyFrom(astronaut.position);
        projectile.rotation = astronaut.rotation;
        
        const speed = 10;
        projectile.velocity = {
            x: Math.cos(astronaut.rotation) * speed,
            y: Math.sin(astronaut.rotation) * speed
        };
        
        projectile.weapon = astronaut.weapon;
        projectile.distance = 0;
        
        this.projectiles.push(projectile);
        this.gameContainer.addChild(projectile);
    }

    createAlien(type) {
        const alien = new PIXI.Container();
        
        // Body
        const body = new PIXI.Graphics();
        body.beginFill(type.color);
        body.drawRect(-type.size.width/2, -type.size.height/2, 
                     type.size.width * 40, type.size.height * 40);
        body.endFill();
        alien.addChild(body);
        
        // Store alien data
        alien.type = type;
        alien.health = type.health;
        
        return alien;
    }

    calculateWaveTargetScore() {
        let maxScore = 0;
        const waveSize = Math.min(3 + this.level + this.wave, 15);
        
        // Calculate maximum possible score for this wave
        for (let i = 0; i < waveSize; i++) {
            const types = Object.values(ALIENS);
            maxScore += Math.max(...types.map(t => t.points));
        }
        
        // Set target as 90% of max possible score
        return Math.floor(maxScore * 0.9);
    }

    spawnAlienWave() {
        this.wave++;
        const waveSize = Math.min(3 + this.level + this.wave, 15);
        this.waveAlienCount = waveSize;
        this.aliensKilled = 0;
        
        for (let i = 0; i < waveSize; i++) {
            const types = Object.values(ALIENS);
            const type = types[Math.floor(Math.random() * types.length)];
            
            const alien = this.createAlien(type);
            
            // Position at right side of screen with random y
            alien.position.set(
                this.app.screen.width + 50,
                Math.random() * (this.app.screen.height - 100) + 50
            );
            
            this.aliens.push(alien);
            this.gameContainer.addChild(alien);
        }
        
        this.targetScore = this.calculateWaveTargetScore();
        this.showAnnouncement(`Wave ${this.wave}`);
        this.updateUI();
    }

    showAnnouncement(text) {
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 48,
            fill: 0xffffff,
            stroke: 0x000000,
            strokeThickness: 4
        });
        
        const announcement = new PIXI.Text(text, style);
        announcement.anchor.set(0.5);
        announcement.position.set(this.app.screen.width/2, this.app.screen.height/2);
        
        this.uiContainer.addChild(announcement);
        
        setTimeout(() => {
            this.uiContainer.removeChild(announcement);
        }, 2000);
    }

    onDragStart(event) {
        if (this.gameStarted && !this.isPaused) return;
        
        const astronaut = event.currentTarget;
        astronaut.alpha = 0.8;
        this.selectedAstronaut = astronaut;
        this.isDragging = true;
        
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
                
                // Clamp to screen bounds
                this.selectedAstronaut.x = Math.max(200, Math.min(this.app.screen.width - 20, this.selectedAstronaut.x));
                this.selectedAstronaut.y = Math.max(20, Math.min(this.app.screen.height - 20, this.selectedAstronaut.y));
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
            this.updateUI();
        }
    }

    createButton(text, x, y, onClick) {
        const button = new PIXI.Container();
        button.eventMode = 'static';
        button.cursor = 'pointer';
        
        const bg = new PIXI.Graphics();
        bg.beginFill(0x4444ff);
        bg.drawRoundedRect(0, 0, 150, 40, 8);
        bg.endFill();
        
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xffffff
        });
        
        const label = new PIXI.Text(text, style);
        label.anchor.set(0.5);
        label.position.set(75, 20);
        
        button.addChild(bg);
        button.addChild(label);
        button.position.set(x, y);
        
        button.on('pointerdown', onClick);
        
        return button;
    }

    setupUI() {
        const style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff
        });

        // Score display and progress bar
        const scoreText = new PIXI.Text(`Score: ${this.score}/${this.targetScore}`, style);
        scoreText.position.set(10, 10);
        this.uiContainer.addChild(scoreText);

        const scoreProgress = this.createProgressBar(10, 40, 200, 20, this.score, this.targetScore);
        this.uiContainer.addChild(scoreProgress);

        // Wave progress
        const waveText = new PIXI.Text(`Wave ${this.wave}/3 Progress`, style);
        waveText.position.set(this.app.screen.width - 210, 10);
        this.uiContainer.addChild(waveText);

        const waveProgress = this.createProgressBar(
            this.app.screen.width - 210, 
            40, 
            200, 
            20, 
            this.aliensKilled,
            this.waveAlienCount,
            0xff4400
        );
        this.uiContainer.addChild(waveProgress);

        const levelText = new PIXI.Text(`Level ${this.level}`, style);
        levelText.position.set(10, 70);
        this.uiContainer.addChild(levelText);

        const instructions = new PIXI.Text(
            'Drag to move astronauts\nHold Shift + Drag to rotate\nCtrl/Cmd + Click for menu',
            { ...style, fontSize: 18 }
        );
        instructions.position.set(10, this.app.screen.height - 80);
        this.uiContainer.addChild(instructions);

        // Add pause button
        const pauseButton = this.createButton(
            this.isPaused ? 'Resume' : 'Pause',
            this.app.screen.width - 160,
            70,
            () => this.togglePause()
        );
        this.uiContainer.addChild(pauseButton);

        // Add restart button when paused
        if (this.isPaused) {
            const restartButton = this.createButton(
                'Restart Level',
                this.app.screen.width - 160,
                120,
                () => this.restartLevel()
            );
            this.uiContainer.addChild(restartButton);
        }
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        this.updateUI();
    }

    restartLevel() {
        // Clear current wave
        this.aliens.forEach(alien => this.gameContainer.removeChild(alien));
        this.aliens = [];
        this.projectiles.forEach(proj => this.gameContainer.removeChild(proj));
        this.projectiles = [];
        
        // Reset wave counter but keep level
        this.wave = 0;
        this.isPaused = false;
        
        // Start new wave
        this.spawnAlienWave();
        this.updateUI();
    }

    updateUI() {
        this.uiContainer.removeChildren();
        this.setupUI();
    }

    update(delta) {
        if (!this.gameStarted || this.isPaused) return;

        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            projectile.position.x += projectile.velocity.x * delta;
            projectile.position.y += projectile.velocity.y * delta;
            
            // Update distance traveled
            projectile.distance += Math.sqrt(
                projectile.velocity.x * projectile.velocity.x +
                projectile.velocity.y * projectile.velocity.y
            ) * delta;
            
            // Check if projectile is out of range
            if (projectile.distance > projectile.weapon.range) {
                this.gameContainer.removeChild(projectile);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check for collisions with aliens
            for (let j = this.aliens.length - 1; j >= 0; j--) {
                const alien = this.aliens[j];
                const dx = projectile.x - alien.x;
                const dy = projectile.y - alien.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < alien.type.size.width * 20) {
                    // Hit! Apply damage
                    alien.health -= projectile.weapon.damage * alien.type.armor;
                    
                    // Remove projectile
                    this.gameContainer.removeChild(projectile);
                    this.projectiles.splice(i, 1);
                    
                    // Check if alien is dead
                    if (alien.health <= 0) {
                        this.gameContainer.removeChild(alien);
                        this.aliens.splice(j, 1);
                        this.score += alien.type.points;
                        this.aliensKilled++;
                        this.updateUI();
                    }
                    break;
                }
            }
        }

        // Update aliens
        for (let i = this.aliens.length - 1; i >= 0; i--) {
            const alien = this.aliens[i];
            alien.position.x -= alien.type.speed * delta;
            
            // Remove aliens that pass the left side
            if (alien.position.x < -50) {
                this.gameContainer.removeChild(alien);
                this.aliens.splice(i, 1);
                this.aliensKilled++;
                this.updateUI();
                continue;
            }
        }

        // Auto-fire weapons
        this.astronauts.forEach(astronaut => {
            this.createProjectile(astronaut);
        });

        // Check wave completion
        if (this.aliens.length === 0) {
            if (this.wave < 3) {
                this.spawnAlienWave();
            } else {
                // Check if score target was met
                if (this.score >= this.targetScore) {
                    // Level complete
                    this.level++;
                    this.wave = 0;
                    if (this.level <= 10) {
                        this.showAnnouncement(`Level ${this.level}`);
                        setTimeout(() => this.spawnAlienWave(), 2000);
                    } else {
                        this.gameWon();
                    }
                } else {
                    // Failed to meet score target
                    this.showAnnouncement('Failed to meet score target!\nTry again!');
                    setTimeout(() => this.restartLevel(), 2000);
                }
            }
        }
    }

    gameWon() {
        this.gameStarted = false;
        this.showAnnouncement(`Game Complete!\nFinal Score: ${this.score}`);
    }

    startGame() {
        this.gameStarted = true;
        this.isPaused = false;
        this.level = 1;
        this.score = 0;
        this.wave = 0;
        this.spawnAlienWave();
    }
}