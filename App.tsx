import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './components/Experience';
import { UIOverlay } from './components/UIOverlay';
import { TreeState } from './types';
import * as THREE from 'three';

const Loader = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-[#000c05] z-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-16 h-16 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
      <span className="text-[#C5A059] font-serif italic text-lg tracking-widest animate-pulse">Loading Experience...</span>
    </div>
  </div>
);

export default function App() {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.TREE_SHAPE);

  return (
    <div className="relative w-full h-screen bg-[#000c05]">
      <UIOverlay treeState={treeState} setTreeState={setTreeState} />
      
      <Suspense fallback={<Loader />}>
        <Canvas
          dpr={[1, 2]} // Handle high DPI screens
          gl={{ 
            antialias: false, // Postprocessing handles AA or we use pixel art style, but here false for bloom perf
            toneMapping: THREE.ReinhardToneMapping,
            toneMappingExposure: 1.5,
            powerPreference: "high-performance"
          }}
          shadows
        >
          <Experience treeState={treeState} setTreeState={setTreeState} />
        </Canvas>
      </Suspense>
    </div>
  );
}
