'use client'

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Float, Stars, Text3D, Center } from '@react-three/drei'
import * as THREE from 'three'

// Particle system component
function Particles({ count = 500 }) {
  const mesh = useRef<THREE.Points>(null)
  const light = useRef<THREE.PointLight>(null)

  const particles = useMemo(() => {
    const temp = []
    for (let i = 0; i < count; i++) {
      const time = Math.random() * 100
      const factor = 20 + Math.random() * 100
      const speed = 0.01 + Math.random() / 200
      const x = Math.random() * 100 - 50
      const y = Math.random() * 100 - 50
      const z = Math.random() * 100 - 50
      temp.push({ time, factor, speed, x, y, z })
    }
    return temp
  }, [count])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    if (mesh.current) {
      particles.forEach((particle, i) => {
        let { factor, speed, x, y, z } = particle
        const t = (particle.time += speed)
        
        dummy.position.set(
          x + Math.cos(t) * factor,
          y + Math.sin(t) * factor,
          z + Math.cos(t) * factor
        )
        dummy.scale.setScalar(Math.sin(t) * 0.5 + 1)
        dummy.updateMatrix()
        
        if (mesh.current) {
          mesh.current.geometry.attributes.position.setXYZ(i, dummy.position.x, dummy.position.y, dummy.position.z)
        }
      })
      if (mesh.current.geometry.attributes.position) {
        mesh.current.geometry.attributes.position.needsUpdate = true
      }
    }

    if (light.current) {
      light.current.position.x = Math.sin(state.clock.elapsedTime * 0.5) * 10
      light.current.position.y = Math.cos(state.clock.elapsedTime * 0.5) * 10
    }
  })

  return (
    <>
      <pointLight ref={light} distance={40} intensity={8} color="#4a9eff" />
      <points ref={mesh}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particles.length}
            array={new Float32Array(particles.length * 3)}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={1} color="#4a9eff" sizeAttenuation transparent opacity={0.8} />
      </points>
    </>
  )
}

// Justice Scale 3D Model (simplified)
function JusticeScale() {
  const scaleRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (scaleRef.current) {
      scaleRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
      <group ref={scaleRef}>
        {/* Base */}
        <mesh position={[0, -2, 0]}>
          <cylinderGeometry args={[2, 2.5, 0.5, 32]} />
          <meshStandardMaterial color="#2a4365" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Pillar */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.3, 4, 16]} />
          <meshStandardMaterial color="#2a4365" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Crossbeam */}
        <mesh position={[0, 2, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 6, 16]} />
          <meshStandardMaterial color="#2a4365" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Left Pan */}
        <group position={[-2.5, 2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
            <meshStandardMaterial color="#2a4365" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, -1, 0]}>
            <cylinderGeometry args={[1, 0.8, 0.3, 32]} />
            <meshStandardMaterial color="#4a9eff" metalness={0.6} roughness={0.3} transparent opacity={0.9} />
          </mesh>
        </group>
        
        {/* Right Pan */}
        <group position={[2.5, 2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
            <meshStandardMaterial color="#2a4365" metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, -1, 0]}>
            <cylinderGeometry args={[1, 0.8, 0.3, 32]} />
            <meshStandardMaterial color="#f687b3" metalness={0.6} roughness={0.3} transparent opacity={0.9} />
          </mesh>
        </group>
      </group>
    </Float>
  )
}

// Floating text
function FloatingText() {
  return (
    <Center position={[0, 4, 0]}>
      <Text3D
        font="/fonts/helvetiker_regular.typeface.json"
        size={0.5}
        height={0.1}
        curveSegments={12}
        bevelEnabled
        bevelThickness={0.02}
        bevelSize={0.02}
        bevelOffset={0}
        bevelSegments={5}
      >
        JUSTICE • TRANSPARENCY • TRUTH
        <meshStandardMaterial color="#4a9eff" metalness={0.5} roughness={0.3} />
      </Text3D>
    </Center>
  )
}

// Main Scene Component
export function JusticeScaleScene({ className }: { className?: string }) {
  return (
    <div className={`${className} bg-gradient-to-b from-background to-background/50`}>
      <Canvas
        camera={{ position: [0, 2, 10], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        shadows
      >
        <Suspense fallback={null}>
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#f687b3" />
          
          {/* Background */}
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          {/* Main Content */}
          <JusticeScale />
          <Particles count={200} />
          
          {/* Controls */}
          <OrbitControls 
            enablePan={false} 
            enableZoom={false} 
            maxPolarAngle={Math.PI / 2}
            minPolarAngle={Math.PI / 3}
            autoRotate
            autoRotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}

// 2D Fallback for mobile
export function JusticeScale2DFallback({ className }: { className?: string }) {
  return (
    <div className={`${className} relative overflow-hidden bg-gradient-to-b from-enterprise-primary/10 to-enterprise-deep/10 rounded-2xl`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full max-w-[300px] max-h-[300px] animate-pulse"
        >
          {/* Scale SVG */}
          <g transform="translate(100, 100)">
            {/* Base */}
            <ellipse cx="0" cy="60" rx="40" ry="10" fill="#2a4365" opacity="0.8" />
            <rect x="-5" y="-40" width="10" height="100" fill="#2a4365" />
            
            {/* Crossbeam */}
            <rect x="-60" y="-45" width="120" height="5" fill="#2a4365" />
            
            {/* Left pan */}
            <line x1="-40" y1="-45" x2="-40" y2="-20" stroke="#2a4365" strokeWidth="2" />
            <circle cx="-40" cy="-15" r="15" fill="#4a9eff" opacity="0.7" />
            
            {/* Right pan */}
            <line x1="40" y1="-45" x2="40" y2="-20" stroke="#2a4365" strokeWidth="2" />
            <circle cx="40" cy="-15" r="15" fill="#f687b3" opacity="0.7" />
          </g>
          
          {/* Animated particles */}
          {[...Array(20)].map((_, i) => (
            <circle
              key={i}
              cx={Math.random() * 200}
              cy={Math.random() * 200}
              r="1"
              fill="#4a9eff"
              opacity="0.6"
            >
              <animate
                attributeName="cy"
                values={`${Math.random() * 200};0;200;${Math.random() * 200}`}
                dur={`${10 + Math.random() * 10}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0;0.6;0"
                dur={`${5 + Math.random() * 5}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
      </div>
      
      <div className="relative z-10 text-center p-8">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-enterprise-primary to-enterprise-deep bg-clip-text text-transparent">
          Justice • Transparency • Truth
        </h3>
      </div>
    </div>
  )
}