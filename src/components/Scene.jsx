import React, { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Plane, Sphere, Cylinder, SoftShadows } from '@react-three/drei';
import { Selection, Select, EffectComposer, Outline } from '@react-three/postprocessing';
import { Draggable } from './Draggable';

function Furniture({ children, initialPosition }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Draggable initialPosition={initialPosition}>
      <Select enabled={hovered}>
        <group
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(false); }}
        >
          {children}
        </group>
      </Select>
    </Draggable>
  );
}

function HangingLamp({ position, brightness, color, isSwinging, offset = 0, intensity = 1 }) {
  const groupRef = useRef();

  useFrame((state) => {
    if (isSwinging && groupRef.current) {
      // Pendulum animation: sin wave based on time
      const time = state.clock.elapsedTime;
      const speed = 2;
      const amplitude = 0.2; // Radians
      groupRef.current.rotation.z = Math.sin(time * speed + offset) * amplitude;
    } else if (groupRef.current) {
      // Reset rotation when not swinging
      groupRef.current.rotation.z = 0; // Could lerp for smoothness, but snap is fine for now
    }
  });

  // Base intensity * user slider (decoupled from global brightness)
  const lightIntensity = 30 * intensity;

  return (
    <group ref={groupRef} position={[position[0], 4.5, position[2]]}>
      {/* Pivot point is at (0,0,0) of this group, which is at y=4.5 world space */}
      {/* Wire */}
      <Cylinder args={[0.02, 0.02, 2]} position={[0, -1, 0]}>
        <meshStandardMaterial color="black" />
      </Cylinder>

      {/* Bulb/Shade - castShadow={false} to prevent blocking its own light */}
      <Sphere args={[0.15]} position={[0, -2, 0]} castShadow={false}>
        <meshStandardMaterial color="white" emissive={color} emissiveIntensity={brightness + intensity * 0.5} />
      </Sphere>

      {/* Light Source */}
      <pointLight
        position={[0, -2.2, 0]}
        intensity={lightIntensity}
        color={color}
        castShadow
        shadow-normalBias={0.04}
        shadow-bias={-0.0001}
      />
    </group>
  );
}

export function Scene({ brightness, isSwinging, lampIntensity, lampHue }) {
  // Calculate light intensity based on brightness prop (0 to 1)
  const ambientIntensity = brightness * 4.5;
  const mainLightIntensity = brightness * 30;
  const lampColor = `hsl(${lampHue}, 100%, 70%)`; // Dynamic color based on hue

  return (
    <>
      <SoftShadows size={25} samples={10} focus={0} />

      {/* Ambient Light for base visibility */}
      <ambientLight intensity={ambientIntensity} />

      {/* Table Lamp */}
      <pointLight
        position={[-2, 1, -1]}
        intensity={mainLightIntensity * 0.8}
        color="#ffccaa"
        distance={5}
        decay={2}
        castShadow
        shadow-normalBias={0.04}
        shadow-bias={-0.0001}
      />

      <Selection>
        <EffectComposer autoClear={false} multisampling={8}>
          <Outline blur edgeStrength={10} width={1000} visibleEdgeColor="white" hiddenEdgeColor="white" />
        </EffectComposer>

        {/* Hanging Lamps */}
        <HangingLamp position={[-1.5, 0, 0]} brightness={brightness} color={lampColor} isSwinging={isSwinging} offset={0} intensity={lampIntensity} />
        <HangingLamp position={[0, 0, 0]} brightness={brightness} color={lampColor} isSwinging={isSwinging} offset={1} intensity={lampIntensity} />
        <HangingLamp position={[1.5, 0, 0]} brightness={brightness} color={lampColor} isSwinging={isSwinging} offset={2} intensity={lampIntensity} />

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
          <Furniture initialPosition={[2, 0.4, 0]}>
            <Box args={[3, 0.8, 1.2]} castShadow receiveShadow>
              <meshStandardMaterial color="#885555" roughness={0.2} />
            </Box>
          </Furniture>

          {/* Coffee Table */}
          <Furniture initialPosition={[-0.5, 0.2, 1]}>
            <Box args={[1.5, 0.4, 1]} castShadow receiveShadow>
              <meshStandardMaterial color="#222" roughness={0.2} />
            </Box>
          </Furniture>

          {/* Chair */}
          <Furniture initialPosition={[-2.5, 0.4, 0]}>
            <Box args={[1, 0.8, 1]} rotation={[0, 0.5, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#555566" roughness={0.2} />
            </Box>
          </Furniture>

          {/* Ottoman */}
          <Furniture initialPosition={[-2.2, 0.25, 1.5]}>
            <Box args={[0.8, 0.5, 0.8]} rotation={[0, 0.2, 0]} castShadow receiveShadow>
              <meshStandardMaterial color="#665555" roughness={0.2} />
            </Box>
          </Furniture>

          {/* TV Stand / Cabinet */}
          <Furniture initialPosition={[0, 0.3, -4]}>
            <Box args={[6, 0.6, 0.8]} castShadow receiveShadow>
              <meshStandardMaterial color="#111" roughness={0.2} />
            </Box>
          </Furniture>
        </group>
      </Selection>
    </>
  );
}
