import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const SnowBackground: React.FC = () => {
  const count = 600; // Increased snow count for romantic atmosphere
  const mesh = useRef<THREE.InstancedMesh>(null);
  
  // Create dummy object for positioning
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  
  // Store velocities
  const particles = React.useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      const speed = 0.005 + Math.random() / 500; // Slower speed
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor });
    }
    return temp;
  }, [count]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    
    particles.forEach((data, i) => {
      let { factor, speed, xFactor, yFactor, zFactor } = data;
      // Update time
      data.t += speed;
      
      const t = data.t;

      // Calculate position with gentle sway
      dummy.position.set(
        xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
        yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
        zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
      );
      
      // Rotate snow
      dummy.rotation.set(t, t, t);
      dummy.scale.setScalar(0.2 + Math.random() * 0.2); // Varied size
      
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
      
      // Reset if too low
      if (dummy.position.y < -30) data.yFactor += 60;
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshBasicMaterial color="white" transparent opacity={0.4} />
    </instancedMesh>
  );
};