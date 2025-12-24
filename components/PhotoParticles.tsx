import React, { useRef } from 'react';
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
  
  const photoIndices = React.useMemo(() => {
    return particles.current
      .map((p, i) => (p.type === 'photo' ? i : -1))
      .filter(i => i !== -1);
  }, [particles]);

  // Luxury Frame Material
  const frameMaterial = React.useMemo(() => new THREE.MeshStandardMaterial({
      color: COLORS.GOLD_METALLIC,
      roughness: 0.1,
      metalness: 0.95,
      envMapIntensity: 2
  }), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    photoIndices.forEach((idx, i) => {
        const child = groupRef.current!.children[i];
        if (!child) return;

        const p = particles.current[idx];
        
        child.position.copy(p.currentPos);
        child.rotation.copy(p.currentRotation);
        
        // INTERACTIVE STATE: PHOTO_VIEW
        if (treeState === TreeState.PHOTO_VIEW) { 
           // If multiple photos, we could pick closest. For now, pick the first one found.
           if (i === 0) {
               // Lerp scale up
               child.scale.lerp(new THREE.Vector3(3.0, 3.0, 3.0), 0.1);
               // Smoothly look at camera
               const targetQ = new THREE.Quaternion();
               const lookDir = state.camera.position.clone().sub(child.position).normalize();
               // Create lookAt quaternion manually to avoid modifying object directly before lerp
               const m = new THREE.Matrix4().lookAt(child.position, state.camera.position, new THREE.Vector3(0,1,0));
               targetQ.setFromRotationMatrix(m);
               child.quaternion.slerp(targetQ, 0.1);
           } else {
               // Shrink others slightly
               child.scale.lerp(new THREE.Vector3(0, 0, 0), 0.1);
           }
        } else {
           // Normal State
           child.scale.lerp(new THREE.Vector3(p.scale, p.scale, p.scale), 0.1);
        }
    });
  });

  return (
    <group ref={groupRef}>
      {photoIndices.map((idx, i) => {
        const p = particles.current[idx];
        return (
          <group key={p.id || idx}>
            {/* Main Frame Structure */}
            <mesh castShadow receiveShadow material={frameMaterial}>
                <boxGeometry args={[1.2, 1.5, 0.05]} /> 
            </mesh>
            
            {/* The Photo Texture Plane */}
            {p.texture && (
                <mesh position={[0, 0, 0.03]}>
                    <planeGeometry args={[1, 1.25]} /> {/* Aspect ratio fix */}
                    <meshBasicMaterial map={p.texture} />
                </mesh>
            )}

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