import * as THREE from 'three';

export enum TreeState {
  TREE_SHAPE = 'TREE_SHAPE',
  EXPLODING = 'EXPLODING',
  REASSEMBLING = 'REASSEMBLING'
}

export interface ParticleData {
  // Target position on the tree
  targetPos: THREE.Vector3;
  // Current dynamic position
  currentPos: THREE.Vector3;
  // Physics properties
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  currentRotation: THREE.Euler;
  // Static properties
  scale: number;
  color: THREE.Color;
  type: 'leaf' | 'ornament_ball' | 'ornament_gift' | 'light' | 'cane';
  mass: number;
  phaseOffset: number; // For breathing animation
}

export interface TreeConfig {
  height: number;
  radius: number;
  leafCount: number;
  ballCount: number;
  giftCount: number;
  lightCount: number;
  caneCount: number;
}
