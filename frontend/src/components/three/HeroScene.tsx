'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Particles({ count = 200 }) {
  const mesh = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 40;
      p[i * 3 + 1] = (Math.random() - 0.5) * 40;
      p[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return geo;
  }, [count]);

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.015;
      mesh.current.rotation.x += delta * 0.005;
    }
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        color="#6db3ff"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

function CoreMesh() {
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.1;
      mesh.current.rotation.y += 0.005;
      mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[2.2, 1]} />
        <MeshDistortMaterial
          color="#41d39b"
          emissive="#41d39b"
          emissiveIntensity={0.15}
          roughness={0.3}
          metalness={0.6}
          distort={0.15}
          speed={1.5}
          transparent
          opacity={0.75}
        />
      </mesh>
    </Float>
  );
}

function OrbitingRings() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  const rings = useMemo(() => {
    return [
      { radius: 3.2, color: '#6db3ff', speed: 0.3 },
      { radius: 4.0, color: '#41d39b', speed: -0.2 },
      { radius: 5.0, color: '#a78bfa', speed: 0.15 },
    ];
  }, []);

  return (
    <group ref={group}>
      {rings.map((ring, i) => (
        <Ring key={i} {...ring} />
      ))}
    </group>
  );
}

function Ring({ radius, color, speed }: { radius: number; color: string; speed: number }) {
  const torus = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (torus.current) {
      torus.current.rotation.x = Math.PI / 3;
      torus.current.rotation.z += state.clock.getDelta() * speed;
    }
  });

  return (
    <mesh ref={torus}>
      <torusGeometry args={[radius, 0.015, 16, 64]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} />
    </mesh>
  );
}

function Scene({ scrollY }: { scrollY: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (group.current) {
      group.current.position.y = scrollY * -0.08;
    }
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, -5]} intensity={0.3} color="#6db3ff" />
      <Particles />
      <OrbitingRings />
      <CoreMesh />
    </group>
  );
}

export default function HeroScene({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <Scene scrollY={scrollY} />
      </Canvas>
    </div>
  );
}
