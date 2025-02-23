import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Weapon definitions
const WEAPONS = {
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

// Alien types
const ALIENS = {
    RUNNER: {
        name: 'Runner',
        health: 50,
        speed: 2,
        armor: 0.8,
        color: 0xff0000,
        size: { width: 0.4, height: 0.8 }
    },
    TANK: {
        name: 'Tank',
        health: 200,
        speed: 0.5,
        armor: 0.4,
        color: 0x880000,
        size: { width: 0.8, height: 1.2 }
    },
    SPRINTER: {
        name: 'Sprinter',
        health: 30,
        speed: 3,
        armor: 0.9,
        color: 0xff6600,
        size: { width: 0.3, height: 0.6 }
    }
};

export class Game {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.astronauts = [];
        this.aliens = [];
        this.weaponRangeHelpers = [];
        this.projectiles = [];
        this.gameStarted = false;
        this.wave = 0;
        this.level = 1;
        this.score = 0;
        this.lastFired = {};
        
        // UI Elements
        this.uiContainer = document.createElement('div');
        this.uiContainer.className = 'absolute top-4 left-4 text-white space-y-2';
        container.parentElement.appendChild(this.uiContainer);
        
        this.init();
        this.setupUI();
    }

    setupUI() {
        this.uiContainer.innerHTML = `
            <div class="bg-gray-900 bg-opacity-75 p-4 rounded-lg">
                <div class="text-2xl font-bold mb-2">Level ${this.level}</div>
                <div class="text-xl">Wave ${this.wave}/3</div>
                <div class="text-xl">Score: ${this.score}</div>
            </div>
        `;
    }

    updateUI() {
        this.setupUI();
    }

    createProjectile(astronaut) {
        const weapon = astronaut.userData.weapon;
        
        // Check fire rate
        const now = Date.now();
        if (this.lastFired[astronaut.id] && now - this.lastFired[astronaut.id] < 1000 / weapon.fireRate) {
            return;
        }
        this.lastFired[astronaut.id] = now;

        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: weapon.color });
        const projectile = new THREE.Mesh(geometry, material);
        
        // Position at weapon tip
        projectile.position.copy(astronaut.position);
        projectile.position.x += 0.5;
        
        // Store projectile data
        projectile.userData = {
            weapon,
            velocity: new THREE.Vector3(1, 0, 0).multiplyScalar(2),
            distance: 0,
            maxRange: weapon.range
        };

        this.projectiles.push(projectile);
        this.scene.add(projectile);
    }

    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            projectile.position.add(projectile.userData.velocity);
            projectile.userData.distance += projectile.userData.velocity.length();
            
            // Check range
            if (projectile.userData.distance > projectile.userData.maxRange) {
                this.scene.remove(projectile);
                this.projectiles.splice(i, 1);
                continue;
            }
            
            // Check hits
            for (let j = this.aliens.length - 1; j >= 0; j--) {
                const alien = this.aliens[j];
                const distance = projectile.position.distanceTo(alien.position);
                
                if (distance < alien.userData.type.size.width) {
                    // Calculate damage with armor
                    const damage = projectile.userData.weapon.damage * alien.userData.type.armor;
                    alien.userData.health -= damage;
                    
                    // Remove projectile
                    this.scene.remove(projectile);
                    this.projectiles.splice(i, 1);
                    
                    // Check if alien is killed
                    if (alien.userData.health <= 0) {
                        this.score += 100 * this.level;
                        this.updateUI();
                    }
                    
                    break;
                }
            }
        }
    }

    startLevel() {
        this.wave = 0;
        this.spawnAlienWave();
        this.announceWave();
    }

    announceWave() {
        const announcement = document.createElement('div');
        announcement.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-white bg-blue-600 bg-opacity-75 p-8 rounded-lg';
        announcement.textContent = `Level ${this.level} - Wave ${this.wave}`;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            announcement.remove();
        }, 2000);
    }

    spawnAlienWave() {
        this.wave++;
        const waveSize = Math.min(3 + this.level + this.wave, 15);
        
        for (let i = 0; i < waveSize; i++) {
            const types = Object.values(ALIENS);
            const type = types[Math.floor(Math.random() * types.length)];
            
            const x = 40 + Math.random() * 10;
            const z = -20 + Math.random() * 40;
            
            const alien = this.createAlien(type, new THREE.Vector3(x, 1, z));
            // Scale health with level
            alien.userData.health *= (1 + (this.level - 1) * 0.2);
            this.aliens.push(alien);
            this.scene.add(alien);
        }
        
        this.announceWave();
    }

    updateAliens() {
        for (let i = this.aliens.length - 1; i >= 0; i--) {
            const alien = this.aliens[i];
            const speed = alien.userData.type.speed;
            
            alien.position.x -= speed * 0.1;
            
            if (alien.position.x < -5) {
                this.scene.remove(alien);
                this.aliens.splice(i, 1);
                // Player takes damage here
            }
            
            if (alien.userData.health <= 0) {
                this.scene.remove(alien);
                this.aliens.splice(i, 1);
            }
        }
        
        if (this.gameStarted && this.aliens.length === 0) {
            if (this.wave < 3) {
                this.spawnAlienWave();
            } else {
                // Level complete
                this.level++;
                if (this.level <= 10) {
                    setTimeout(() => this.startLevel(), 2000);
                } else {
                    this.gameWon();
                }
            }
        }
    }

    gameWon() {
        const announcement = document.createElement('div');
        announcement.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl font-bold text-white bg-green-600 bg-opacity-75 p-8 rounded-lg';
        announcement.textContent = `Congratulations! You've completed all levels!\nFinal Score: ${this.score}`;
        document.body.appendChild(announcement);
    }

    init() {
        // Setup renderer
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setClearColor(0x000000);
        this.container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 15, 20);
        this.camera.lookAt(0, 0, 0);

        // Setup controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Create moon surface
        this.createMoonSurface();
        
        // Create spaceship and rock
        this.createSpaceship();
        this.createRock();
        
        // Create astronauts with different weapons
        this.createAstronauts();

        // Start animation loop
        this.animate();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize(), false);
    }

    createMoonSurface() {
        const geometry = new THREE.PlaneGeometry(100, 100, 64, 64);
        
        // Create displacement for terrain
        const positions = geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] = Math.random() * 0.3;
        }
        
        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.8,
            metalness: 0.2,
        });
        
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
        this.scene.add(plane);
    }

    createSpaceship() {
        const geometry = new THREE.CylinderGeometry(1, 2, 4, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const spaceship = new THREE.Mesh(geometry, material);
        spaceship.position.set(-8, 2, -5);
        spaceship.rotation.x = Math.PI / 6;
        this.scene.add(spaceship);
    }

    createRock() {
        const geometry = new THREE.DodecahedronGeometry(2);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x555555,
            roughness: 1
        });
        const rock = new THREE.Mesh(geometry, material);
        rock.position.set(-6, 1, 0);
        this.scene.add(rock);
    }

    createWeaponRangeHelper(position, angle, range, color) {
        // Create a cone to show the weapon's range and angle
        const angleRad = (angle * Math.PI) / 180;
        const radius = Math.tan(angleRad) * range;
        const geometry = new THREE.ConeGeometry(radius, range, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2,
            wireframe: true
        });
        
        const cone = new THREE.Mesh(geometry, material);
        cone.position.copy(position);
        cone.rotation.x = Math.PI / 2;
        
        return cone;
    }

    createAstronauts() {
        const weapons = [
            WEAPONS.RIFLE,
            WEAPONS.PLASMA,
            WEAPONS.FLAMETHROWER,
            WEAPONS.RAILGUN
        ];

        // Create 4 astronauts with different weapons
        for (let i = 0; i < 4; i++) {
            const weapon = weapons[i];
            const astronaut = this.createAstronaut(weapon);
            astronaut.position.set(-4 + i * 2, 1, -2 + i);
            
            // Create and add weapon range helper
            const rangeHelper = this.createWeaponRangeHelper(
                astronaut.position,
                weapon.angle,
                weapon.range,
                weapon.color
            );
            this.weaponRangeHelpers.push(rangeHelper);
            this.scene.add(rangeHelper);
            
            this.astronauts.push(astronaut);
            this.scene.add(astronaut);
        }
    }

    createAstronaut(weapon) {
        const group = new THREE.Group();

        // Body
        const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.5, 4, 8);
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        // Helmet
        const helmetGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const helmetMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.2
        });
        const helmet = new THREE.Mesh(helmetGeometry, helmetMaterial);
        helmet.position.y = 0.5;
        group.add(helmet);

        // Weapon
        const gunGeometry = new THREE.BoxGeometry(
            weapon.size.width,
            weapon.size.width,
            weapon.size.length
        );
        const gunMaterial = new THREE.MeshStandardMaterial({ color: weapon.color });
        const gun = new THREE.Mesh(gunGeometry, gunMaterial);
        gun.position.set(0.4, 0.2, 0);
        group.add(gun);

        // Store weapon data
        group.userData.weapon = weapon;

        return group;
    }

    createAlien(type, startPosition) {
        const group = new THREE.Group();
        
        // Alien body
        const bodyGeometry = new THREE.CapsuleGeometry(
            type.size.width / 2,
            type.size.height,
            4,
            8
        );
        const bodyMaterial = new THREE.MeshStandardMaterial({ color: type.color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        group.add(body);

        // Store alien data
        group.userData.type = type;
        group.userData.health = type.health;
        group.position.copy(startPosition);

        return group;
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.gameStarted) {
            this.updateProjectiles();
            this.updateAliens();
            
            // Auto-fire weapons
            this.astronauts.forEach(astronaut => {
                this.createProjectile(astronaut);
            });
        }
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    startGame() {
        this.gameStarted = true;
        this.level = 1;
        this.score = 0;
        this.startLevel();
    }
}