// Image assets library
export const IMAGES = {
  // Terrain textures
  moonSurface: new URL('./terrain/moon-surface.png', import.meta.url).href,
  rockTexture: new URL('./terrain/rock.png', import.meta.url).href,
  
  // Astronaut textures
  astronautBody: new URL('./astronauts/body.png', import.meta.url).href,
  astronautHelmet: new URL('./astronauts/helmet.png', import.meta.url).href,
  
  // Weapon textures
  pistolTexture: new URL('./weapons/pistol.png', import.meta.url).href,
  rifleTexture: new URL('./weapons/rifle.png', import.meta.url).href,
  plasmaTexture: new URL('./weapons/plasma.png', import.meta.url).href,
  flamethrowerTexture: new URL('./weapons/flamethrower.png', import.meta.url).href,
  railgunTexture: new URL('./weapons/railgun.png', import.meta.url).href,
  
  // Alien textures
  runnerTexture: new URL('./aliens/runner.png', import.meta.url).href,
  tankTexture: new URL('./aliens/tank.png', import.meta.url).href,
  sprinterTexture: new URL('./aliens/sprinter.png', import.meta.url).href,
  
  // Effect textures
  muzzleFlash: new URL('./effects/muzzle-flash.png', import.meta.url).href,
  explosion: new URL('./effects/explosion.png', import.meta.url).href,
  shield: new URL('./effects/shield.png', import.meta.url).href
};