import React, { useState, Suspense, useCallback } from 'react';
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
  const [userPhotos, setUserPhotos] = useState<THREE.Texture[]>([]);

  const handlePhotoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const loader = new THREE.TextureLoader();
      
      files.forEach(file => {
        const url = URL.createObjectURL(file as Blob);
        loader.load(url, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          setUserPhotos(prev => [...prev, texture]);
        });
      });
    }
  }, []);

  return (
    <div className="relative w-full h-screen bg-[#000c05]">
      <UIOverlay 
        treeState={treeState} 
        setTreeState={setTreeState} 
        onUpload={handlePhotoUpload} 
      />
      
      <Suspense fallback={<Loader />}>
        <Canvas
          dpr={[1, 2]} 
          gl={{ 
            antialias: false,
            toneMapping: THREE.ReinhardToneMapping,
            toneMappingExposure: 2.5, // Increased from 1.8 to 2.5 for much brighter look
            powerPreference: "high-performance"
          }}
          shadows
        >
          <Experience 
            treeState={treeState} 
            setTreeState={setTreeState} 
            userPhotos={userPhotos}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}