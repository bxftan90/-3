import React, { useMemo, useRef, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { ParticleData, TreeState } from '../types';
import { COLORS } from '../constants';

// Custom Shader for Emerald & Gold Breathing Particles
const FoliageMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColorBase: { value: new THREE.Color(COLORS.EMERALD_DEEP) },
    uColorTip: { value: new THREE.Color(COLORS.EMERALD_LIGHT) }, // Changed from Gold to Light Green for more "Green" look
    uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    uSize: { value: 16.0 } // Slightly larger particles
  },
  vertexShader: `
    uniform float uTime;
    uniform float uPixelRatio;
    uniform float uSize;
    attribute float phaseOffset;
    attribute float scale;
    
    varying float vAlpha;
    varying vec2 vUv;
    varying float vPhase;

    void main() {
      vUv = uv;
      vPhase = phaseOffset;
      
      // Breathing effect
      float breath = sin(uTime * 2.0 + phaseOffset) * 0.1 + 0.9;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = uSize * scale * breath * uPixelRatio * (20.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
      
      // Fade based on depth or effect
      vAlpha = 1.0;
    }
  `,
  fragmentShader: `
    uniform vec3 uColorBase;
    uniform vec3 uColorTip;
    varying float vAlpha;
    varying float vPhase;

    void main() {
      // Create a soft circle/star shape
      vec2 coord = gl_PointCoord - vec2(0.5);
      float dist = length(coord);
      
      if (dist > 0.5) discard;
      
      // Gradient from center (Light Green) to edge (Deep Emerald)
      float glow = 1.0 - smoothstep(0.1, 0.5, dist);
      vec3 finalColor = mix(uColorTip, uColorBase, smoothstep(0.0, 0.4, dist));
      
      // Add a tiny golden sparkle based on phase (occasional)
      float sparkle = step(0.98, sin(vPhase * 10.0 + uColorBase.r)); // Randomized timing
      finalColor += vec3(1.0, 0.8, 0.2) * sparkle * 0.5;

      gl_FragColor = vec4(finalColor, 0.9 * glow);
    }
  `
};

interface FoliageProps {
  particles: React.MutableRefObject<ParticleData[]>;
  treeState: TreeState;
}

export const Foliage: React.FC<FoliageProps> = ({ particles, treeState }) => {
  const geomRef = useRef<THREE.BufferGeometry>(null);
  const shaderRef = useRef<THREE.ShaderMaterial>(null);

  // Initialize buffer attributes
  const count = particles.current.length;
  
  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const scales = useMemo(() => new Float32Array(count), [count]);
  const phases = useMemo(() => new Float32Array(count), [count]);

  useLayoutEffect(() => {
    // Initial data population
    const pData = particles.current;
    for (let i = 0; i < count; i++) {
      const p = pData[i];
      scales[i] = p.scale;
      phases[i] = p.phaseOffset;
      // Set initial position
      positions[i * 3] = p.currentPos.x;
      positions[i * 3 + 1] = p.currentPos.y;
      positions[i * 3 + 2] = p.currentPos.z;
    }
    if (geomRef.current) {
      geomRef.current.attributes.position.needsUpdate = true;
      geomRef.current.attributes.scale.needsUpdate = true;
    }
  }, [count, particles, positions, scales, phases]);

  useFrame((state) => {
    if (!geomRef.current || !shaderRef.current) return;

    // Update Uniforms
    shaderRef.current.uniforms.uTime.value = state.clock.elapsedTime;

    // Update Positions and Scales from physics simulation
    const pData = particles.current;
    const posAttr = geomRef.current.attributes.position;
    const scaleAttr = geomRef.current.attributes.scale;
    
    for (let i = 0; i < count; i++) {
      const p = pData[i];
      posAttr.setXYZ(i, p.currentPos.x, p.currentPos.y, p.currentPos.z);
      // We update scale here to support dynamic hiding (scale=0) of inactive particles
      scaleAttr.setX(i, p.scale);
    }
    posAttr.needsUpdate = true;
    scaleAttr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-scale"
          count={count}
          array={scales}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-phaseOffset"
          count={count}
          array={phases}
          itemSize={1}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={shaderRef}
        args={[FoliageMaterial]}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};