import { Howl } from 'howler';
import * as THREE from 'three';

export class AssetLoader {
  private static textureLoader = new THREE.TextureLoader();
  private static audioCache = new Map();
  private static textureCache = new Map();

  static async loadSounds() {
    const response = await fetch('/assets/audio/sounds.json');
    const data = await response.json();
    
    Object.entries(data.sounds).forEach(([key, url]) => {
      if (!this.audioCache.has(key)) {
        const sound = new Howl({
          src: [url as string],
          volume: 0.3
        });
        this.audioCache.set(key, sound);
      }
    });
    
    return this.audioCache;
  }

  static async loadTextures() {
    const response = await fetch('/assets/textures/textures.json');
    const data = await response.json();
    
    const loadPromises = Object.entries(data.textures).map(async ([key, url]) => {
      if (!this.textureCache.has(key)) {
        const texture = await this.textureLoader.loadAsync(url as string);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        this.textureCache.set(key, texture);
      }
    });
    
    await Promise.all(loadPromises);
    return this.textureCache;
  }
}