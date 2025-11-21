import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Plane, Sphere, Cylinder, SoftShadows } from '@react-three/drei';
import { Draggable } from './Draggable';

export function Scene({ brightness }) {
  // Calculate light intensity based on brightness prop (0 to 1)
  const ambientIntensity = brightness * 4.5;
  const mainLightIntensity = brightness * 30;
  const lampColor = '#ffaa77'; // Warm light

  return (
    <>
      <SoftShadows size={25} samples={10} focus={0} />

      {/* Ambient Light for base visibility */}
      <ambientLight intensity={ambientIntensity} />

      {/* Main Ceiling Lights (Simulated as point lights) */}
      {/* Left Lamp */}
      <pointLight
        position={[-1.5, 3, 0]}
        intensity={mainLightIntensity}
        color={lampColor}
        castShadow
        shadow-bias={-0.001}
      />
      {/* Center Lamp */}
      <pointLight
        position={[0, 3, 0]}
        intensity={mainLightIntensity}
        color={lampColor}
        castShadow
        shadow-bias={-0.001}
      />
      {/* Right Lamp */}
      <pointLight
        position={[1.5, 3, 0]}
        intensity={mainLightIntensity}
        color={lampColor}
        castShadow
        shadow-bias={-0.001}
      />

      {/* Table Lamp */}
      <pointLight
        position={[-2, 1, -1]}
        intensity={mainLightIntensity * 0.8}
        color="#ffccaa"
        distance={5}
        decay={2}
        castShadow
      />

      {/* Room Structure */}
      <group position={[0, -1.5, 0]}>
        {/* Floor */}
        <Plane
          args={[10, 10]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <meshStandardMaterial color="#333" roughness={0.8} />
        </Plane>

        {/* Back Wall */}
        <Plane
          args={[10, 6]}
          position={[0, 3, -5]}
          receiveShadow
        >
          <meshStandardMaterial color="#554444" roughness={1} />
        </Plane>

        {/* Left Wall (Window side) */}
        <Plane
          args={[10, 6]}
          position={[-5, 3, 0]}
          rotation={[0, Math.PI / 2, 0]}
          receiveShadow
        >
          <meshStandardMaterial color="#222" roughness={1} />
        </Plane>
      </group>

      {/* Furniture Placeholders */}
      <group position={[0, -1.5, 0]}>
        {/* Sofa */}
        <Draggable initialPosition={[2, 0.4, 0]}>
          <Box args={[3, 0.8, 1.2]} castShadow receiveShadow>
            <meshStandardMaterial color="#885555" roughness={0.2} />
          </Box>
        </Draggable>

        {/* Coffee Table */}
        <Draggable initialPosition={[-0.5, 0.2, 1]}>
          <Box args={[1.5, 0.4, 1]} castShadow receiveShadow>
            <meshStandardMaterial color="#222" roughness={0.2} />
          </Box>
        </Draggable>

        {/* Chair */}
        <Draggable initialPosition={[-2.5, 0.4, 0]}>
          <Box args={[1, 0.8, 1]} rotation={[0, 0.5, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#555566" roughness={0.2} />
          </Box>
        </Draggable>

        {/* Ottoman */}
        <Draggable initialPosition={[-2.2, 0.25, 1.5]}>
          <Box args={[0.8, 0.5, 0.8]} rotation={[0, 0.2, 0]} castShadow receiveShadow>
            <meshStandardMaterial color="#665555" roughness={0.2} />
          </Box>
        </Draggable>

        {/* TV Stand / Cabinet */}
        <Draggable initialPosition={[0, 0.3, -4]}>
          <Box args={[6, 0.6, 0.8]} castShadow receiveShadow>
            <meshStandardMaterial color="#111" roughness={0.2} />
          </Box>
        </Draggable>

        {/* Hanging Lamps (Visuals) */}
        <group position={[0, 4.5, 0]}>
          <Cylinder args={[0.02, 0.02, 2]} position={[-1.5, 0, 0]}>
            <meshStandardMaterial color="black" />
          </Cylinder>
          <Sphere args={[0.15]} position={[-1.5, -1, 0]}>
            <meshStandardMaterial color="white" emissive={lampColor} emissiveIntensity={brightness} />
          </Sphere>

          <Cylinder args={[0.02, 0.02, 2]} position={[0, 0, 0]}>
            <meshStandardMaterial color="black" />
          </Cylinder>
          <Sphere args={[0.15]} position={[0, -1, 0]}>
            <meshStandardMaterial color="white" emissive={lampColor} emissiveIntensity={brightness} />
          </Sphere>

          <Cylinder args={[0.02, 0.02, 2]} position={[1.5, 0, 0]}>
            <meshStandardMaterial color="black" />
          </Cylinder>
          <Sphere args={[0.15]} position={[1.5, -1, 0]}>
            <meshStandardMaterial color="white" emissive={lampColor} emissiveIntensity={brightness} />
          </Sphere>
        </group>
      </group>
    </>
  );
}
