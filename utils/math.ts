import * as THREE from 'three';

/**
 * Generates a random point inside a cone volume (for the tree shape)
 */
export const getRandomPointInCone = (height: number, radius: number): THREE.Vector3 => {
  const y = Math.random() * height; // Height from bottom (0 to height)
  // Radius at this height (linear taper)
  const rAtHeight = radius * (1 - y / height);
  
  // Random point in circle at this height
  const angle = Math.random() * Math.PI * 2;
  const rRandom = Math.sqrt(Math.random()) * rAtHeight; // Sqrt for uniform distribution
  
  const x = Math.cos(angle) * rRandom;
  const z = Math.sin(angle) * rRandom;
  
  // Center the tree vertically around 0 roughly, slightly up
  return new THREE.Vector3(x, y - height * 0.4, z);
};

/**
 * Generates a point on the surface of the cone
 * Biased towards 0 (Top) if simple random is used, creating clustering.
 * This version assumes simplistic random Y. 
 * Kept for backward compat if needed, but prefer getUniformSurfacePointInCone.
 */
export const getPointOnConeSurface = (height: number, radius: number): THREE.Vector3 => {
  const y = Math.random() * height;
  const rAtHeight = radius * (1 - y / height);
  const angle = Math.random() * Math.PI * 2;
  
  const x = Math.cos(angle) * rAtHeight;
  const z = Math.sin(angle) * rAtHeight;
  
  return new THREE.Vector3(x, y - height * 0.4, z);
};

/**
 * Generates a point on the surface of the cone distributed uniformly by area.
 * Prevents clustering at the top.
 */
export const getUniformSurfacePointInCone = (height: number, radius: number): THREE.Vector3 => {
  // To distribute uniformly on the surface area of a cone:
  // We sample distance from tip based on PDF f(d) ~ d. 
  // d = height * sqrt(random) roughly approximates this for the slant height
  // y from base = height * (1 - sqrt(random))
  
  const r = Math.sqrt(Math.random());
  const y = height * (1 - r); // r=0 -> y=height(tip), r=1 -> y=0(base)
  
  const rAtHeight = radius * (1 - y / height);
  const angle = Math.random() * Math.PI * 2;
  
  const x = Math.cos(angle) * rAtHeight;
  const z = Math.sin(angle) * rAtHeight;
  
  return new THREE.Vector3(x, y - height * 0.4, z);
};

/**
 * Helper to get a random drift vector
 */
export const getRandomVector = (scale: number = 1): THREE.Vector3 => {
  return new THREE.Vector3(
    (Math.random() - 0.5) * scale,
    (Math.random() - 0.5) * scale,
    (Math.random() - 0.5) * scale
  );
};