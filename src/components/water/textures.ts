/**
 * Creates a procedural tile texture for pool walls and floor
 */
export function createTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base color
  ctx.fillStyle = '#e8f4f8';
  ctx.fillRect(0, 0, 256, 256);

  // Tile grid
  const tileSize = 32;
  ctx.strokeStyle = '#b8d4e8';
  ctx.lineWidth = 2;

  for (let y = 0; y < 256; y += tileSize) {
    for (let x = 0; x < 256; x += tileSize) {
      ctx.strokeRect(x + 1, y + 1, tileSize - 2, tileSize - 2);
    }
  }

  // Add noise
  const imageData = ctx.getImageData(0, 0, 256, 256);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 10;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  
  return texture;
}

/**
 * Creates a procedural skybox cubemap texture
 */
export function createSkyboxTexture(): THREE.CubeTexture {
  const size = 512;
  
  function createFace(topColor: string, bottomColor: string, addClouds = false): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    if (addClouds) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size * 0.5;
        const w = 50 + Math.random() * 100;
        const h = 20 + Math.random() * 40;
        ctx.beginPath();
        ctx.ellipse(x, y, w, h, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    return canvas;
  }

  const skyTop = '#1e3a5f';
  const skyBottom = '#5b8bb5';
  const groundTop = '#5b8bb5';
  const groundBottom = '#7aa5c4';

  const cubeTexture = new THREE.CubeTexture([
    createFace(skyTop, skyBottom, true),  // px
    createFace(skyTop, skyBottom, true),  // nx
    createFace('#0d1f33', '#1e3a5f'),     // py
    createFace(groundTop, groundBottom),  // ny
    createFace(skyTop, skyBottom, true),  // pz
    createFace(skyTop, skyBottom, true),  // nz
  ]);
  
  cubeTexture.needsUpdate = true;
  
  return cubeTexture;
}

import * as THREE from 'three';
