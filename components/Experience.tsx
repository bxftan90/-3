import React, { useRef, useState, useCallback } from 'react';
import { PerspectiveCamera, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { TreeSystem } from './TreeSystem';
import { SnowBackground } from './SnowBackground';
import { HandController } from './HandController';
import { TreeState } from '../types';
import { COLORS } from '../constants';
import * as THREE from 'three';
// @ts-ignore
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

interface ExperienceProps {
  treeState: TreeState;
  setTreeState: (s: TreeState) => void;
  userPhotos: THREE.Texture[];
}

export const Experience: React.FC<ExperienceProps> = ({ treeState, setTreeState, userPhotos }) => {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  const handleCameraRotate = (deltaX: number) => {
    if (controlsRef.current) {
        controlsRef.current.setAzimuthalAngle(controlsRef.current.getAzimuthalAngle() + deltaX);
    }
  };

  // Logic to cycle through photos when "Grabbing"
  const handleGrabPhoto = useCallback(() => {
    if (userPhotos.length > 0) {
        setActivePhotoIndex((prev) => (prev + 1) % userPhotos.length);
    }
  }, [userPhotos.length]);

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 18]} fov={45} />
      <OrbitControls 
        ref={controlsRef}
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={30}
        autoRotate={treeState === TreeState.TREE_SHAPE}
        autoRotateSpeed={0.5}
      />

      {/* --- Hand Control System --- */}
      <HandController 
         treeState={treeState} 
         setTreeState={setTreeState} 
         onCameraRotate={handleCameraRotate}
         onGrabPhoto={handleGrabPhoto}
      />

      {/* --- Lighting (Brightened for Luxury Feel) --- */}
      <ambientLight intensity={1.5} color={COLORS.EMERALD_DEEP} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={6.0} 
        castShadow 
        color={COLORS.WARM_WHITE}
      />
      <pointLight position={[-10, 5, -10]} intensity={3.5} color={COLORS.GOLD_METALLIC} />
      <pointLight position={[0, 10, 10]} intensity={2.0} color="#ff7e7e" distance={20} />
      
      {/* ADDED: Bottom Fill Light for Gifts */}
      <pointLight position={[0, -5, 5]} intensity={5.0} color="#ffaa55" distance={15} decay={2} />

      {/* --- Environment --- */}
      <Environment preset="city" />
      <color attach="background" args={[COLORS.BACKGROUND]} />
      <fog attach="fog" args={[COLORS.BACKGROUND, 10, 50]} />

      {/* --- Content --- */}
      <TreeSystem 
        treeState={treeState} 
        setTreeState={setTreeState} 
        userPhotos={userPhotos} 
        activePhotoIndex={activePhotoIndex}
      />
      <SnowBackground />
      
      <ContactShadows opacity={0.7} scale={40} blur={2} far={10} resolution={256} color="#000000" />

      {/* --- Post Processing (Cinematic Look) --- */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={1.0} // Bloom threshold
          mipmapBlur 
          intensity={1.2} 
          radius={0.5}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.6} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </>
  );
};