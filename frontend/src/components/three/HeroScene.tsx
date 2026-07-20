'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function Particles({ count = 400 }) {
  const mesh = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 50;
      p[i * 3 + 1] = (Math.random() - 0.5) * 50;
      p[i * 3 + 2] = (Math.random() - 0.5) * 50;
      
      const color = new THREE.Color();
      color.setHSL(0.35 + Math.random() * 0.15, 0.6, 0.4 + Math.random() * 0.3);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [count]);

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.012;
      mesh.current.rotation.x += delta * 0.004;
    }
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function StarField({ count = 200 }) {
  const mesh = useRef<THREE.Points>(null);
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 80;
      p[i * 3 + 1] = (Math.random() - 0.5) * 80;
      p[i * 3 + 2] = (Math.random() - 0.5) * 80 - 10;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3));
    return geo;
  }, [count]);

  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.002;
    }
  });

  return (
    <points ref={mesh} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color="#ffffff"
        transparent
        opacity={0.3}
        sizeAttenuation
      />
    </points>
  );
}

function CoreMesh() {
  const mesh = useRef<THREE.Mesh>(null);
  const glowMesh = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (mesh.current) {
      mesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.12;
      mesh.current.rotation.y += 0.004;
      mesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.2;
    }
    if (glowMesh.current) {
      glowMesh.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.12) * 0.12;
      glowMesh.current.rotation.y += 0.004;
      glowMesh.current.position.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.2;
      glowMesh.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05);
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.4}>
      {/* Outer glow */}
      <mesh ref={glowMesh}>
        <icosahedronGeometry args={[2.8, 1]} />
        <meshBasicMaterial
          color="#41d39b"
          transparent
          opacity={0.06}
          wireframe
        />
      </mesh>
      {/* Core */}
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.8, 1]} />
        <MeshDistortMaterial
          color="#41d39b"
          emissive="#41d39b"
          emissiveIntensity={0.25}
          roughness={0.2}
          metalness={0.7}
          distort={0.2}
          speed={2}
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Inner core glow */}
      <mesh>
        <icosahedronGeometry args={[1.0, 1]} />
        <meshBasicMaterial
          color="#6db3ff"
          transparent
          opacity={0.15}
        />
      </mesh>
    </Float>
  );
}

function OrbitingRings() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.08) * 0.04;
    }
  });

  const rings = useMemo(() => {
    return [
      { radius: 3.0, color: '#6db3ff', speed: 0.25, opacity: 0.15 },
      { radius: 3.8, color: '#41d39b', speed: -0.18, opacity: 0.12 },
      { radius: 4.8, color: '#a78bfa', speed: 0.12, opacity: 0.1 },
      { radius: 6.0, color: '#f59e0b', speed: -0.08, opacity: 0.06 },
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

function Ring({ radius, color, speed, opacity }: { radius: number; color: string; speed: number; opacity: number }) {
  const torus = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (torus.current) {
      torus.current.rotation.x = Math.PI / 2.8;
      torus.current.rotation.z += state.clock.getDelta() * speed;
    }
  });

  return (
    <mesh ref={torus}>
      <torusGeometry args={[radius, 0.018, 16, 80]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

function EnergyBeams() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (group.current) {
      group.current.rotation.y += state.clock.getDelta() * 0.1;
    }
  });

  const beams = useMemo(() => {
    const temp: { angle: number; color: string; length: number }[] = [];
    const colors = ['#41d39b', '#6db3ff', '#a78bfa', '#f59e0b'];
    for (let i = 0; i < 8; i++) {
      temp.push({
        angle: (i / 8) * Math.PI * 2,
        color: colors[i % colors.length],
        length: 3 + Math.random() * 2,
      });
    }
    return temp;
  }, []);

  return (
    <group ref={group}>
      {beams.map((beam, i) => (
        <Beam key={i} {...beam} />
      ))}
    </group>
  );
}

function Beam({ angle, color, length }: { angle: number; color: string; length: number }) {
  const beamRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (beamRef.current) {
      const scale = 0.3 + Math.sin(state.clock.elapsedTime * 2 + angle) * 0.2;
      beamRef.current.scale.y = scale;
    }
  });

  return (
    <mesh
      ref={beamRef}
      position={[Math.cos(angle) * 2.2, 0, Math.sin(angle) * 2.2]}
      rotation={[0, -angle, Math.PI / 2]}
    >
      <planeGeometry args={[0.02, length]} />
      <meshBasicMaterial color={color} transparent opacity={0.15} />
    </mesh>
  );
}

function Scene({ scrollY }: { scrollY: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (group.current) {
      group.current.position.y = scrollY * -0.06;
    }
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[3, 5, 5]} intensity={0.6} />
      <pointLight position={[-5, -3, -5]} intensity={0.2} color="#6db3ff" />
      <pointLight position={[5, -3, -5]} intensity={0.2} color="#a78bfa" />
      <StarField />
      <Particles />
      <OrbitingRings />
      <EnergyBeams />
      <CoreMesh />
    </group>
  );
}

export default function HeroScene({ scrollY = 0 }: { scrollY?: number }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <Scene scrollY={scrollY} />
      </Canvas>
    </div>
  );
}
