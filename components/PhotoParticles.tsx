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
  
  // Memoize indices once, as we now pre-allocate and types don't change
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
    
    let activeIndex = 0;
    
    photoIndices.forEach((idx, i) => {
        const child = groupRef.current!.children[i];
        if (!child) return;

        const p = particles.current[idx];
        
        // Update Transform
        child.position.copy(p.currentPos);
        child.rotation.copy(p.currentRotation);
        
        // Hide inactive particles completely
        if (!p.active) {
            child.scale.set(0, 0, 0);
            return;
        }

        // INTERACTIVE STATE: PHOTO_VIEW
        if (treeState === TreeState.PHOTO_VIEW) { 
           // Calculate which active photo this is
           // NOTE: logic here must match TreeSystem loop to sync with physics logic if needed
           // For simplicity, we just use local counter.
           if (activeIndex === 0) { // First active photo logic handled by physics? 
               // Wait, logic should match specific active index. 
               // TreeSystem moves the correct one to center. We just follow physics here.
               // But we do scale effect here.
               
               // To find if THIS particle is the one currently centered, check proximity to camera target?
               // Or we can rely on p.currentPos being moved by Physics.
               // We just want scale up.
               
               // Simpler check: If it's close to camera, scale up?
               const distToCam = child.position.distanceTo(state.camera.position);
               if (distToCam < 15) { // Threshold for "Selected"
                    child.scale.lerp(new THREE.Vector3(3.0, 3.0, 3.0), 0.1);
                    
                    const targetQ = new THREE.Quaternion();
                    const m = new THREE.Matrix4().lookAt(child.position, state.camera.position, new THREE.Vector3(0,1,0));
                    targetQ.setFromRotationMatrix(m);
                    child.quaternion.slerp(targetQ, 0.1);
               } else {
                    child.scale.lerp(new THREE.Vector3(p.scale, p.scale, p.scale), 0.1);
               }
           } else {
               child.scale.lerp(new THREE.Vector3(p.scale, p.scale, p.scale), 0.1);
           }
           activeIndex++;
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
        // Note: p.texture might be undefined initially or updated via ref mutation.
        // We rely on parent re-rendering to update the Texture prop here if active changes.
        return (
          <group key={p.id || idx}>
            {/* Main Frame Structure */}
            <mesh castShadow receiveShadow material={frameMaterial}>
                <boxGeometry args={[1.2, 1.5, 0.05]} /> 
            </mesh>
            
            {/* The Photo Texture Plane - Only render mesh if active/texture exists to save draw calls? 
                Actually, easier to just hide via scale if inactive. 
                But updating texture is needed. */}
            <mesh position={[0, 0, 0.03]}>
                <planeGeometry args={[1, 1.25]} /> 
                {p.texture ? (
                     <meshBasicMaterial map={p.texture} />
                ) : (
                     <meshBasicMaterial color="black" />
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