import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ParticleData, TreeState } from '../types';
import { COLORS } from '../constants';

interface PhotoParticlesProps {
  particles: React.MutableRefObject<ParticleData[]>;
  treeState: TreeState;
}

export const PhotoParticles: React.FC<PhotoParticlesProps> = ({ particles, treeState }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Indices of particles that are allocated for photos
  const photoIndices = useMemo(() => {
    return particles.current
      .map((p, i) => (p.type === 'photo' ? i : -1))
      .filter(i => i !== -1);
  }, [particles]);

  // Luxury Frame Material (Golden)
  const frameMaterial = useMemo(() => new THREE.MeshStandardMaterial({
      color: COLORS.GOLD_METALLIC,
      roughness: 0.1,
      metalness: 0.95,
      envMapIntensity: 2
  }), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Determine the "Active" photo to show in PHOTO_VIEW (Show the last added one)
    let lastActiveIndex = -1;
    photoIndices.forEach((idx, i) => {
        if (particles.current[idx].active) lastActiveIndex = i;
    });

    photoIndices.forEach((idx, i) => {
        const child = groupRef.current!.children[i];
        if (!child) return;

        const p = particles.current[idx];
        
        // 1. HIDDEN STATE (Inactive)
        if (!p.active) {
            child.scale.setScalar(0);
            return;
        }

        // 2. TREE SHAPE (ASSEMBLED) - FORCE HELIX POSITION
        // We ignore particle physics here to ensure frames "stick" to the tree
        if (treeState === TreeState.TREE_SHAPE) {
            const height = 14;
            // Distribute active photos along a spiral
            const t = i / Math.max(photoIndices.length, 1);
            
            // Calculate Spiral Position
            const startY = height * 0.45; // Start near top
            const spacingY = 0.8; 
            // Absolute positioning based on index to keep them stable
            const y = startY - (i * spacingY); 
            
            // Radius tapers with height (Cone shape)
            const treeRadiusAtY = 5.0 * (1 - (y + height * 0.4) / height);
            const r = Math.max(treeRadiusAtY + 1.2, 1.5); // Offset from tree surface
            
            const angle = i * 0.8; // Rotate around tree
            
            const targetX = Math.cos(angle) * r;
            const targetZ = Math.sin(angle) * r;
            const targetPos = new THREE.Vector3(targetX, y, targetZ);

            // Smoothly move to slot
            child.position.lerp(targetPos, 0.1);
            
            // Orientation Fix: Look OUTWARD from center
            // By looking at a point twice as far along the radius, we ensure the front face points out
            child.lookAt(targetPos.x * 2, targetPos.y, targetPos.z * 2);
            
            // Normal Scale
            child.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        } 
        
        // 3. EXPLODING - USE PHYSICS
        else if (treeState === TreeState.EXPLODING || treeState === TreeState.REASSEMBLING) {
            child.position.copy(p.currentPos);
            child.rotation.copy(p.currentRotation);
            child.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
        }

        // 4. PHOTO VIEW - FOCUS ON ONE
        else if (treeState === TreeState.PHOTO_VIEW) {
           // If this is the latest photo, bring to center
           if (i === lastActiveIndex) {
               const camDir = new THREE.Vector3();
               state.camera.getWorldDirection(camDir);
               // Position 15 units in front of camera
               const target = state.camera.position.clone().add(camDir.multiplyScalar(15));
               
               child.position.lerp(target, 0.08);
               
               // Orientation Fix: Face the CAMERA directly
               child.lookAt(state.camera.position);
               
               // Scale UP
               child.scale.lerp(new THREE.Vector3(3.5, 3.5, 3.5), 0.08);
           } else {
               // Push others away/hide slightly
               child.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
           }
        }
    });
  });

  return (
    <group ref={groupRef}>
      {photoIndices.map((idx, i) => {
        const p = particles.current[idx];
        
        // Ensure color space is correct to prevent washed out/white textures
        if (p.texture) {
            p.texture.colorSpace = THREE.SRGBColorSpace;
        }

        return (
          <group key={`photo-frame-${i}`}>
            {/* Main Frame Structure */}
            <mesh castShadow receiveShadow material={frameMaterial}>
                <boxGeometry args={[1.2, 1.5, 0.05]} /> 
            </mesh>
            
            {/* The Photo Texture Plane */}
            {/* Fix: Use standard white color and REMOVE toneMapped={false} to avoid overexposure */}
            <mesh position={[0, 0, 0.035]}>
                <planeGeometry args={[1, 1.25]} /> 
                {p.texture ? (
                     <meshBasicMaterial map={p.texture} color="#ffffff" side={THREE.DoubleSide} />
                ) : (
                     <meshBasicMaterial color="#111" />
                )}
            </mesh>

            {/* Inner Gold Rim */}
            <mesh position={[0,0,0.03]} scale={[1.05, 1.3, 1]}>
                <ringGeometry args={[0.48, 0.5, 4]} />
                <meshBasicMaterial color={COLORS.GOLD_METALLIC} />
            </mesh>
            
            {/* Decorative Top Hook */}
            <mesh position={[0, 0.8, 0]} material={frameMaterial}>
                <torusGeometry args={[0.1, 0.02, 8, 16]} />
            </mesh>
          </group>
        )
      })}
    </group>
  );
};