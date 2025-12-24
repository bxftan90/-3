import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { ParticleData, TreeState } from '../types';
import { COLORS, PHYSICS, TREE_CONFIG } from '../constants';
import { getRandomPointInCone, getPointOnConeSurface, getUniformSurfacePointInCone, getRandomVector } from '../utils/math';
import { Foliage } from './Foliage';
import { OrnamentLayer } from './InstancedOrnaments';
import { StarTopper } from './StarTopper';
import { PhotoParticles } from './PhotoParticles';

interface TreeSystemProps {
  treeState: TreeState;
  setTreeState: (s: TreeState) => void;
  userPhotos: THREE.Texture[];
  activePhotoIndex: number;
}

export const TreeSystem: React.FC<TreeSystemProps> = ({ treeState, setTreeState, userPhotos, activePhotoIndex }) => {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useRef<ParticleData[]>([]);
  
  const { camera } = useThree();

  // ---------------------------------------------
  // 1. Data Generation (Run ONCE at startup)
  // ---------------------------------------------
  useMemo(() => {
    const p: ParticleData[] = [];
    const { height, radius, leafCount, ballCount, giftCount, lightCount, MAX_PHOTOS } = TREE_CONFIG;

    const MAX_Y = height * 0.55; 

    // Helper to add particle
    const addParticle = (type: ParticleData['type'], target: THREE.Vector3, scale: number, mass: number, color: THREE.Color, texture?: THREE.Texture, forcedRotation?: THREE.Euler) => {
      // Clamp Y to avoid star collision
      if (target.y > MAX_Y) target.y = MAX_Y - Math.random();

      p.push({
        targetPos: target,
        currentPos: target.clone(), // Start assembled
        velocity: new THREE.Vector3(0, 0, 0),
        angularVelocity: new THREE.Vector3(0, 0, 0),
        currentRotation: forcedRotation ? forcedRotation.clone() : new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, 0),
        scale,
        type,
        mass,
        color,
        phaseOffset: Math.random() * 10,
        texture,
        id: Math.random().toString(36).substr(2, 9),
        active: true // Default active
      });
    };

    // A. Foliage
    for (let i = 0; i < leafCount; i++) {
      const pos = getRandomPointInCone(height, radius);
      addParticle('leaf', pos, 0.15 + Math.random() * 0.1, 0.1, COLORS.EMERALD_DEEP);
    }

    // B. Balls
    for (let i = 0; i < ballCount; i++) {
      const pos = getUniformSurfacePointInCone(height, radius * 0.9);
      addParticle('ornament_ball', pos, 0.2 + Math.random() * 0.2, 1.0, COLORS.GOLD_METALLIC);
    }

    // C. Gifts
    for (let i = 0; i < giftCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * radius * 1.2;
      const pos = new THREE.Vector3(Math.cos(angle) * r, -height * 0.45, Math.sin(angle) * r);
      addParticle('ornament_gift', pos, 0.6 + Math.random() * 0.4, 2.0, COLORS.RED_RIBBON);
    }

    // D. Lights
    for (let i = 0; i < lightCount; i++) {
      const pos = getPointOnConeSurface(height, radius * 0.95); 
      addParticle('light', pos, 0.1, 0.05, COLORS.WARM_WHITE);
    }

    // F. Photos (Pre-allocate MAX_PHOTOS slots)
    // We initialize them with a default position, they will be updated by useEffect
    for (let i = 0; i < MAX_PHOTOS; i++) {
        // Default position far below
        const pos = new THREE.Vector3(0, -100, 0); 
        const rot = new THREE.Euler(0, 0, 0);
        
        p.push({
            targetPos: pos,
            currentPos: pos.clone(),
            velocity: new THREE.Vector3(0, 0, 0),
            angularVelocity: new THREE.Vector3(0, 0, 0),
            currentRotation: rot,
            scale: 0, // Start invisible
            type: 'photo',
            mass: 1.5,
            color: COLORS.GOLD_METALLIC,
            phaseOffset: Math.random() * 10,
            texture: undefined,
            id: `photo-${i}`,
            active: false
        });
    }

    particles.current = p;
  }, []); // Run once!

  // ---------------------------------------------
  // 1.5 Update Photos when user uploads
  // ---------------------------------------------
  useEffect(() => {
    const { height, radius } = TREE_CONFIG;
    let photoIndex = 0;

    particles.current.forEach(p => {
        if (p.type === 'photo') {
            if (photoIndex < userPhotos.length) {
                // Activate this slot
                p.active = true;
                p.texture = userPhotos[photoIndex];
                p.scale = 1.0; 

                // Calculate Spiral Position
                const t = photoIndex / Math.max(userPhotos.length - 1, 1);
                const startY = height * 0.4;
                const endY = -height * 0.3;
                const y = startY - t * (startY - endY);
                const treeRadiusAtY = radius * (1 - (y + height * 0.4) / height);
                const spiralRadius = treeRadiusAtY + 1.5; 
                const rotations = 3;
                const angle = t * Math.PI * 2 * rotations;
                const x = Math.cos(angle) * spiralRadius;
                const z = Math.sin(angle) * spiralRadius;
                
                // Update Target
                p.targetPos.set(x, y, z);
                
                // If it was previously inactive/far away, we might want to snap it closer or let it fly in.
                // Letting it fly in from -100 might be too much, let's snap currentPos if it was inactive
                if (p.currentPos.y < -50) {
                     p.currentPos.copy(p.targetPos);
                }

                // Force face outward
                p.currentRotation.set(0, -angle, 0);
                
                photoIndex++;
            } else {
                // Deactivate this slot
                p.active = false;
                p.texture = undefined;
                p.scale = 0; 
                p.targetPos.set(0, -100, 0);
            }
        }
    });

  }, [userPhotos]);

  // ---------------------------------------------
  // 2. Physics Simulation Loop
  // ---------------------------------------------
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1); 
    const time = state.clock.elapsedTime;
    let currentPhotoIdx = 0;

    particles.current.forEach(p => {
      
      // -- STATE 1: EXPLODING / SCATTER --
      if (treeState === TreeState.EXPLODING) {
        if (p.velocity.lengthSq() < 0.01 && p.currentPos.distanceTo(p.targetPos) < 0.1) {
           const centerAxis = new THREE.Vector3(0, p.currentPos.y, 0);
           const direction = new THREE.Vector3().subVectors(p.currentPos, centerAxis).normalize();
           if (direction.lengthSq() === 0) direction.set(1, 0, 0);
           direction.add(getRandomVector(0.5)).normalize();
           const force = PHYSICS.EXPLOSION_FORCE * (Math.random() * 0.5 + 0.5);
           p.velocity.copy(direction.multiplyScalar(force));
           p.angularVelocity.set(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(10);
        }

        p.currentPos.addScaledVector(p.velocity, dt);
        p.velocity.multiplyScalar(PHYSICS.DAMPING);
        p.angularVelocity.multiplyScalar(PHYSICS.ROTATION_DAMPING);
        p.currentRotation.x += p.angularVelocity.x * dt;
        p.currentRotation.y += p.angularVelocity.y * dt;
        p.currentRotation.z += p.angularVelocity.z * dt;

        if (p.velocity.length() < 0.5) {
          p.currentPos.y += Math.sin(time + p.phaseOffset) * PHYSICS.GRAVITY_DRIFT;
        }

      // -- STATE 2: REASSEMBLING / TREE SHAPE --
      } else if (treeState === TreeState.TREE_SHAPE || treeState === TreeState.REASSEMBLING) {
        const dist = p.currentPos.distanceTo(p.targetPos);
        if (dist > 0.01) {
          const speed = PHYSICS.REASSEMBLE_SPEED / Math.sqrt(p.mass);
          p.currentPos.lerp(p.targetPos, speed);
          
          p.velocity.set(0,0,0);
          p.angularVelocity.set(0,0,0);
        } else {
           p.currentPos.copy(p.targetPos);
        }

      // -- STATE 3: PHOTO VIEW --
      } else if (treeState === TreeState.PHOTO_VIEW) {
         if (p.type === 'photo') {
             if (p.active) {
                 // Logic: Bring the ACTIVE photo to center of screen
                 if (currentPhotoIdx === activePhotoIndex) {
                     // Calculate position in front of camera
                     const camDir = new THREE.Vector3();
                     camera.getWorldDirection(camDir);
                     const target = camera.position.clone().add(camDir.multiplyScalar(12)); // 12 units in front
                     
                     p.currentPos.lerp(target, 0.05);
                     p.velocity.set(0,0,0);
                 } else {
                     // Push others away slightly or keep drifting
                     p.currentPos.y += Math.sin(time + p.phaseOffset) * 0.02;
                 }
                 currentPhotoIdx++;
             } else {
                 // Inactive photos stay hidden/drifting
                 p.scale = 0; 
             }
         } else {
             // All other particles drift or scatter slightly
             if (p.currentPos.length() < 8) {
                 // Gently push out if too close to center to clear view for photo
                 p.currentPos.addScaledVector(p.currentPos.clone().normalize(), 0.05);
             }
             p.currentPos.y += Math.sin(time + p.phaseOffset) * 0.02;
         }
      }
    });

    if (groupRef.current && treeState === TreeState.TREE_SHAPE) {
      groupRef.current.rotation.y += dt * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      <Foliage particles={particles} treeState={treeState} />
      <OrnamentLayer particles={particles} />
      <PhotoParticles particles={particles} treeState={treeState} />
      
      <group position={[0, TREE_CONFIG.height * 0.6, 0]}> 
        <StarTopper treeState={treeState} />
      </group>
    </group>
  );
};