import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const SnowBackground: React.FC = () => {
  const count = 2500; // Increased count significantly
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = React.useMemo(() => new THREE.Object3D(), []);
  
  const particles = React.useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const t = Math.random() * 100;
      const factor = 20 + Math.random() * 100;
      // Increased base speed
      const speed = 0.01 + Math.random() / 200; 
      const xFactor = -50 + Math.random() * 100;
      const yFactor = -50 + Math.random() * 100;
      const zFactor = -50 + Math.random() * 100;
      temp.push({ t, factor, speed, xFactor, yFactor, zFactor });
    }
    return temp;
  }, [count]);

  useFrame((state) => {
    if (!mesh.current) return;
    
    const time = state.clock.elapsedTime;
    // Faster wind
    const windForce = Math.sin(time * 0.5) * 0.08 + 0.04; 

    particles.forEach((data, i) => {
      let { factor, speed, xFactor, yFactor, zFactor } = data;
      
      data.t += speed;
      const t = data.t;

      const sway = Math.cos(t * factor * 0.05); 
      const windDrift = windForce * (time * 15); 

      // Fall faster
      let y = yFactor - (time * speed * 400) % 100; 
      if (y < -50) y += 100; 

      let xPos = xFactor + Math.sin(t) + (time * 4); 
      if (xPos > 50) { 
         data.xFactor -= 100; 
         xPos -= 100; 
      }

      dummy.position.set(
        xPos,
        y,
        zFactor + Math.cos(t)
      );
      
      dummy.rotation.set(t, t, t);
      // Large snowflakes
      dummy.scale.setScalar(0.2 + Math.random() * 0.4); 
      
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshBasicMaterial color="white" transparent opacity={0.7} />
    </instancedMesh>
  );
};