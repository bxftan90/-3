import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TreeState } from '../types';
import { COLORS } from '../constants';

export const StarTopper: React.FC<{ treeState: TreeState }> = ({ treeState }) => {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  // Create 5-point star geometry
  const starGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    const points = 5;
    const outerRadius = 0.8;
    const innerRadius = 0.4;
    
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outerRadius : innerRadius;
      // Rotate by -PI/2 to point upwards
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r;
      const y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    
    return new THREE.ExtrudeGeometry(shape, {
      depth: 0.2,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3
    });
  }, []);

  useFrame((state) => {
    if (!ref.current || !glowRef.current) return;
    
    // Spin logic
    ref.current.rotation.y = state.clock.elapsedTime * 0.5;
    
    // Pulse logic
    const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    ref.current.scale.setScalar(scale);
    
    // Explosion logic: If exploding, fly up a bit
    if (treeState === TreeState.EXPLODING) {
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, 5, 0.05);
    } else {
        ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, 0, 0.05);
    }
  });

  return (
    <group ref={ref}>
      {/* Core Star */}
      <mesh geometry={starGeometry}>
        <meshStandardMaterial 
            color={COLORS.GOLD_METALLIC} 
            emissive={COLORS.GOLD_METALLIC}
            emissiveIntensity={2}
            roughness={0.2}
            metalness={1}
        />
      </mesh>
      
      {/* Glow Halo */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial 
            color={COLORS.WARM_WHITE} 
            transparent 
            opacity={0.3} 
            depthWrite={false}
            side={THREE.BackSide}
        />
      </mesh>
      
      {/* Point Light for surrounding illumination */}
      <pointLight 
        color={COLORS.WARM_WHITE} 
        intensity={2} 
        distance={10} 
        decay={2} 
      />
    </group>
  );
};