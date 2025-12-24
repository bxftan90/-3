import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ParticleData, TreeState, TreeConfig } from '../types';
import { COLORS, PHYSICS, TREE_CONFIG } from '../constants';
import { getRandomPointInCone, getPointOnConeSurface, getRandomVector } from '../utils/math';
import { Foliage } from './Foliage';
import { OrnamentLayer } from './InstancedOrnaments';
import { StarTopper } from './StarTopper';

interface TreeSystemProps {
  treeState: TreeState;
  setTreeState: (s: TreeState) => void;
}

export const TreeSystem: React.FC<TreeSystemProps> = ({ treeState, setTreeState }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // ---------------------------------------------
  // 1. Data Generation (Run once)
  // ---------------------------------------------
  const particles = useRef<ParticleData[]>([]);

  useMemo(() => {
    const p: ParticleData[] = [];
    const { height, radius, leafCount, ballCount, giftCount, lightCount, caneCount } = TREE_CONFIG;

    // Helper to add particle
    const addParticle = (type: ParticleData['type'], target: THREE.Vector3, scale: number, mass: number, color: THREE.Color) => {
      p.push({
        targetPos: target,
        currentPos: target.clone(), // Start assembled
        velocity: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0),
        currentRotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        scale,
        type,
        mass,
        color,
        phaseOffset: Math.random() * 10
      });
    };

    // A. Foliage
    for (let i = 0; i < leafCount; i++) {
      const pos = getRandomPointInCone(height, radius);
      addParticle('leaf', pos, 0.15 + Math.random() * 0.1, 0.1, COLORS.EMERALD_DEEP);
    }

    // B. Balls
    for (let i = 0; i < ballCount; i++) {
      const pos = getPointOnConeSurface(height, radius * 0.9);
      addParticle('ornament_ball', pos, 0.2 + Math.random() * 0.2, 1.0, COLORS.GOLD_METALLIC);
    }

    // C. Gifts (At the bottom)
    for (let i = 0; i < giftCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 1.2; // Spread around base
      const pos = new THREE.Vector3(Math.cos(angle) * r, -height * 0.45, Math.sin(angle) * r);
      addParticle('ornament_gift', pos, 0.6 + Math.random() * 0.4, 2.0, COLORS.RED_RIBBON);
    }

    // D. Lights
    for (let i = 0; i < lightCount; i++) {
      const pos = getPointOnConeSurface(height, radius * 0.95);
      addParticle('light', pos, 0.1, 0.05, COLORS.WARM_WHITE);
    }

    // E. Canes
    for (let i = 0; i < caneCount; i++) {
      const pos = getPointOnConeSurface(height, radius * 0.85);
      addParticle('cane', pos, 0.2, 0.5, new THREE.Color(0xffffff));
    }

    particles.current = p;
  }, []);

  // ---------------------------------------------
  // 2. Physics Simulation Loop
  // ---------------------------------------------
  useFrame((state, delta) => {
    // Safety cap for delta to prevent huge jumps on lag
    const dt = Math.min(delta, 0.1); 

    particles.current.forEach(p => {
      
      if (treeState === TreeState.EXPLODING) {
        // --- EXPLOSION PHYSICS ---
        // If just started exploding (velocity is zero), give impulsive force
        // We use a small threshold to detect if it's "static"
        if (p.velocity.lengthSq() < 0.01 && p.currentPos.distanceTo(p.targetPos) < 0.1) {
           // Calculate direction from center (0, y, 0)
           const centerAxis = new THREE.Vector3(0, p.currentPos.y, 0);
           const direction = new THREE.Vector3().subVectors(p.currentPos, centerAxis).normalize();
           if (direction.lengthSq() === 0) direction.set(1, 0, 0); // Safety
           
           // Randomize explosion vector slightly
           direction.add(getRandomVector(0.5)).normalize();
           
           const force = PHYSICS.EXPLOSION_FORCE * (Math.random() * 0.5 + 0.5);
           p.velocity.copy(direction.multiplyScalar(force));
           
           // Add heavy spin
           p.angularVelocity.set(
             Math.random() - 0.5,
             Math.random() - 0.5,
             Math.random() - 0.5
           ).multiplyScalar(10);
        }

        // Apply Velocity
        p.currentPos.addScaledVector(p.velocity, dt);
        
        // Apply Drag/Damping
        p.velocity.multiplyScalar(PHYSICS.DAMPING);
        p.angularVelocity.multiplyScalar(PHYSICS.ROTATION_DAMPING);

        // Apply Rotation
        p.currentRotation.x += p.angularVelocity.x * dt;
        p.currentRotation.y += p.angularVelocity.y * dt;
        p.currentRotation.z += p.angularVelocity.z * dt;

        // Add subtle floating noise when slow
        if (p.velocity.length() < 0.5) {
          p.currentPos.y += Math.sin(state.clock.elapsedTime + p.phaseOffset) * PHYSICS.GRAVITY_DRIFT;
        }

      } else if (treeState === TreeState.TREE_SHAPE || treeState === TreeState.REASSEMBLING) {
        // --- REASSEMBLY PHYSICS (Spring/Lerp) ---
        
        // Interpolate Position
        const dist = p.currentPos.distanceTo(p.targetPos);
        
        if (dist > 0.01) {
          // Lerp factor based on mass (lighter moves faster)
          const speed = PHYSICS.REASSEMBLE_SPEED / Math.sqrt(p.mass);
          p.currentPos.lerp(p.targetPos, speed);
          
          // Reset Velocity/AngularVelocity for clean state next time
          p.velocity.set(0,0,0);
          p.angularVelocity.set(0,0,0);
          
          // Reset Rotation to upright (or target rotation if we stored it)
          // For simplicity, just dampen rotation to 0,0,0 or original random
          // Here we just let it freeze effectively
        } else {
           p.currentPos.copy(p.targetPos);
        }
      }
    });

    // Rotate the whole group slowly for showcase
    if (groupRef.current) {
      groupRef.current.rotation.y += dt * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <Foliage particles={particles} treeState={treeState} />
      <OrnamentLayer particles={particles} />
      {/* Star Topper is attached to the top, we manually place it */}
      <group position={[0, TREE_CONFIG.height * 0.6, 0]}> 
         {/* Slightly adjusted height because coordinate system is centered on group */}
        <StarTopper treeState={treeState} />
      </group>
    </group>
  );
};
