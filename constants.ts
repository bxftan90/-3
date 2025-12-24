import * as THREE from 'three';

export const COLORS = {
  EMERALD_DEEP: new THREE.Color('#004225'), // Slightly richer green
  EMERALD_LIGHT: new THREE.Color('#006B3C'),
  GOLD_METALLIC: new THREE.Color('#FFD700'),
  SILVER_METALLIC: new THREE.Color('#C0C0C0'),
  GOLD_ROSE: new THREE.Color('#E0BFB8'),
  RED_RIBBON: new THREE.Color('#8a0303'), // Box color
  GREEN_RIBBON: new THREE.Color('#006B3C'), // Ribbon color
  WARM_WHITE: new THREE.Color('#FFFDD0'),
  BACKGROUND: '#000804'
};

export const PHYSICS = {
  EXPLOSION_FORCE: 25, // Strength of outward burst
  DAMPING: 0.96, // Air resistance during explosion
  REASSEMBLE_SPEED: 0.04, // Lerp factor for returning
  ROTATION_DAMPING: 0.98,
  GRAVITY_DRIFT: 0.02 // Slight drift when floating
};

export const TREE_CONFIG = {
  height: 14,
  radius: 5,
  leafCount: 4000,
  ballCount: 120,
  giftCount: 25,
  lightCount: 200, // Increased lights
  caneCount: 40
};