import React from 'react';
import { PerspectiveCamera, OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { TreeSystem } from './TreeSystem';
import { SnowBackground } from './SnowBackground';
import { TreeState } from '../types';
import { COLORS } from '../constants';

interface ExperienceProps {
  treeState: TreeState;
  setTreeState: (s: TreeState) => void;
}

export const Experience: React.FC<ExperienceProps> = ({ treeState, setTreeState }) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 4, 18]} fov={45} />
      <OrbitControls 
        enablePan={false} 
        minPolarAngle={Math.PI / 4} 
        maxPolarAngle={Math.PI / 1.8}
        minDistance={10}
        maxDistance={30}
        autoRotate={treeState === TreeState.TREE_SHAPE}
        autoRotateSpeed={0.5}
      />

      {/* --- Lighting --- */}
      <ambientLight intensity={0.2} color={COLORS.EMERALD_DEEP} />
      <spotLight 
        position={[10, 20, 10]} 
        angle={0.5} 
        penumbra={1} 
        intensity={2} 
        castShadow 
        color={COLORS.WARM_WHITE}
      />
      <pointLight position={[-10, 5, -10]} intensity={1} color={COLORS.GOLD_METALLIC} />
      
      {/* --- Environment --- */}
      <Environment preset="city" />
      <color attach="background" args={[COLORS.BACKGROUND]} />
      <fog attach="fog" args={[COLORS.BACKGROUND, 10, 50]} />

      {/* --- Content --- */}
      <TreeSystem treeState={treeState} setTreeState={setTreeState} />
      <SnowBackground />
      
      <ContactShadows opacity={0.7} scale={40} blur={2} far={10} resolution={256} color="#000000" />

      {/* --- Post Processing (Cinematic Look) --- */}
      <EffectComposer disableNormalPass>
        <Bloom 
          luminanceThreshold={1.1} // Only very bright things bloom
          mipmapBlur 
          intensity={0.8} 
          radius={0.6}
        />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </>
  );
};
