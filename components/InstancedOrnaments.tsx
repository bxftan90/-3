import React, { useRef, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ParticleData } from '../types';
import { COLORS } from '../constants';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

interface InstancedGroupProps {
  particles: React.MutableRefObject<ParticleData[]>;
  type: 'ornament_ball' | 'ornament_gift' | 'light' | 'cane';
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  // Optional override for color logic
  colorOverride?: (index: number) => THREE.Color;
  // Special flag to render ribbon for gifts
  isRibbon?: boolean;
}

const InstancedGroup: React.FC<InstancedGroupProps> = ({ particles, type, geometry, material, colorOverride, isRibbon }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = new THREE.Object3D();
  const tempColor = new THREE.Color();

  // Filter particles for this specific type
  const indices = useMemo(() => {
    return particles.current
      .map((p, i) => (p.type === type ? i : -1))
      .filter((i) => i !== -1);
  }, [particles, type]);

  const count = indices.length;

  useLayoutEffect(() => {
    if (!meshRef.current) return;
    
    // Initial Setup
    indices.forEach((idx, i) => {
      const p = particles.current[idx];
      dummy.position.copy(p.currentPos);
      dummy.rotation.copy(p.currentRotation);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Initial Color Setting
      if (colorOverride) {
        meshRef.current!.setColorAt(i, colorOverride(i));
      } else if (type === 'ornament_ball') {
         // Random mix of Gold and Silver
         const r = Math.random();
         let color;
         if (r < 0.5) color = COLORS.GOLD_METALLIC;
         else if (r < 0.8) color = COLORS.SILVER_METALLIC;
         else color = COLORS.EMERALD_LIGHT;
         meshRef.current!.setColorAt(i, color);
      } else if (type === 'light') {
         meshRef.current!.setColorAt(i, COLORS.WARM_WHITE);
      } else if (type === 'ornament_gift') {
         // Box is red, Ribbon is green
         const color = isRibbon ? COLORS.GREEN_RIBBON : COLORS.RED_RIBBON;
         meshRef.current!.setColorAt(i, color);
      }
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [count, indices, particles, type, colorOverride, isRibbon]);

  useFrame((state) => {
    if (!meshRef.current) return;

    // Update transforms based on physics simulation
    let needsUpdate = false;
    let needsColorUpdate = false;
    const time = state.clock.elapsedTime;
    
    indices.forEach((idx, i) => {
      const p = particles.current[idx];
      dummy.position.copy(p.currentPos);
      dummy.rotation.copy(p.currentRotation);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      needsUpdate = true;

      // Twinkling Logic for Lights
      if (type === 'light') {
        // Create a twinkle effect: smooth sine wave + random offset
        const flicker = (Math.sin(time * 3 + p.phaseOffset * 2) + 1) / 2; 
        const intensity = 0.2 + flicker * 1.5; // Base glow + flash
        tempColor.copy(COLORS.WARM_WHITE).multiplyScalar(intensity);
        meshRef.current!.setColorAt(i, tempColor);
        needsColorUpdate = true;
      }
    });

    if (needsUpdate) {
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
    if (needsColorUpdate && meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  if (count === 0) return null;

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      castShadow
      receiveShadow
    />
  );
};

export const OrnamentLayer: React.FC<{ particles: React.MutableRefObject<ParticleData[]> }> = ({ particles }) => {
  // Geometries
  const ballGeo = useMemo(() => new THREE.SphereGeometry(1, 32, 32), []);
  const lightGeo = useMemo(() => new THREE.SphereGeometry(0.5, 16, 16), []);
  
  // Gift Geometry (Box)
  const boxGeo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  
  // Gift Ribbon Geometry (Merged Cross)
  const ribbonGeo = useMemo(() => {
    const g1 = new THREE.BoxGeometry(1.02, 1.02, 0.2); 
    const g2 = new THREE.BoxGeometry(0.2, 1.02, 1.02);
    const geo = BufferGeometryUtils.mergeGeometries([g1, g2]);
    return geo;
  }, []);

  // --- Materials ---
  const metallicMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.GOLD_METALLIC,
    roughness: 0.1,
    metalness: 0.9,
    envMapIntensity: 1.5
  }), []);

  const giftBoxMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.RED_RIBBON, 
    roughness: 0.3,
    metalness: 0.2
  }), []);

  const giftRibbonMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: COLORS.GREEN_RIBBON,
    roughness: 0.4,
    metalness: 0.3
  }), []);

  const lightMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: COLORS.WARM_WHITE,
    toneMapped: false 
  }), []);

  return (
    <group>
      <InstancedGroup particles={particles} type="ornament_ball" geometry={ballGeo} material={metallicMat} />
      <InstancedGroup particles={particles} type="ornament_gift" geometry={boxGeo} material={giftBoxMat} />
      <InstancedGroup particles={particles} type="ornament_gift" geometry={ribbonGeo} material={giftRibbonMat} isRibbon={true} />
      <InstancedGroup particles={particles} type="light" geometry={lightGeo} material={lightMat} />
      {/* Cane REMOVED */}
    </group>
  );
};