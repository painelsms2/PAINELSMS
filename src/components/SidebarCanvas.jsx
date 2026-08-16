import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';

const AbstractMesh = () => {
  const meshRef = useRef();

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.05;
      meshRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef} position={[0, 0, -2]}>
        <icosahedronGeometry args={[4, 1]} />
        <meshBasicMaterial 
          color="#ffffff" 
          wireframe 
          transparent 
          opacity={0.03} 
        />
      </mesh>
    </Float>
  );
};

export const SidebarCanvas = () => {
  // Respect prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return null; // Fallback to CSS static gradient
  }

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none', opacity: 0.8 }}>
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 50 }} 
        dpr={[1, 1.5]} // Cap DPR for performance
        gl={{ antialias: false, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <AbstractMesh />
        <Sparkles 
          count={40} 
          scale={10} 
          size={4} 
          speed={0.2} 
          opacity={0.15} 
          color="#ffffff" 
        />
      </Canvas>
    </div>
  );
};
