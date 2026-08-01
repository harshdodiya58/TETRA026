"use client";

import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, MeshDistortMaterial, ContactShadows, Lightformer } from '@react-three/drei';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function MorphingBlob() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Use state to ensure we only apply GSAP after mount to avoid hydration mismatch or flashing
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!meshRef.current) return;

    // Proper GSAP cleanup pattern for React
    let ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // smoother scrub
        onUpdate: (self) => {
          if (meshRef.current) {
            // Smoothly rotate based on scroll progress
            meshRef.current.rotation.y = self.progress * Math.PI * 4;
            meshRef.current.position.y = (self.progress * -2); // slightly move down as we scroll
          }
        }
      });
    });

    return () => ctx.revert(); // Cleanup on unmount to prevent flashing
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      // Idle floating animation
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      meshRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  // Don't render complex mesh until mounted to prevent hydration flash
  if (!mounted) return null;

  return (
    <Float floatIntensity={3} rotationIntensity={2} speed={1.5}>
      <mesh ref={meshRef} scale={2.5}>
        <sphereGeometry args={[1, 128, 128]} />
        {/* Next-level liquid metal / glowing aesthetic */}
        <MeshDistortMaterial 
          color="#1e3a8a" // Deep blue
          emissive="#3b82f6" // Glowing neon blue
          emissiveIntensity={0.5}
          roughness={0.1}
          metalness={0.8}
          distort={0.4}
          speed={2}
          envMapIntensity={2}
        />
      </mesh>
    </Float>
  );
}

export default function CanvasScene() {
  return (
    <div className="fixed top-0 left-0 w-screen h-screen -z-10 pointer-events-none bg-black">
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]} // Support high-DPI screens for crisp rendering
      >
        <color attach="background" args={['#000000']} />
        
        <ambientLight intensity={0.2} />
        <directionalLight position={[5, 5, 5]} intensity={2} color="#ffffff" />
        <directionalLight position={[-5, -5, -5]} intensity={3} color="#4338ca" />
        <pointLight position={[0, 0, 5]} intensity={1} color="#60a5fa" />
        
        <MorphingBlob />
        
        {/* Custom environment for insane reflections */}
        <Environment resolution={256}>
          <group rotation={[-Math.PI / 4, -0.3, 0]}>
            <Lightformer intensity={4} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
            <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[10, 2, 1]} />
            <Lightformer intensity={2} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 2, 1]} color="#3b82f6" />
          </group>
        </Environment>
        
        <ContactShadows position={[0, -3.5, 0]} opacity={0.8} scale={15} blur={2.5} far={4} color="#1e3a8a" />
      </Canvas>
    </div>
  );
}
