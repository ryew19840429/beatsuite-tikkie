import React, { useState, useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Plane, Sphere, Cylinder, SoftShadows } from '@react-three/drei';
import { Selection, Select, EffectComposer, Outline } from '@react-three/postprocessing';
import { Draggable } from './Draggable';

const Furniture = React.memo(function Furniture({ children, initialPosition, name, setHoveredFurniture }) {
  const [hovered, setHovered] = useState(false);

  return (
    <Draggable initialPosition={initialPosition}>
      <Select enabled={hovered}>
        <group
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true); setHoveredFurniture(name); }}
          onPointerOut={(e) => { e.stopPropagation(); setHovered(false); setHoveredFurniture(null); }}
        >
          {children}
        </group>
      </Select>
    </Draggable>
  );
});

const HangingLamp = React.memo(function HangingLamp({ position, brightness, color, isSwinging, offset = 0, intensity = 1 }) {
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
  const lightIntensity = 60 * intensity;

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
        distance={0}
        castShadow
        shadow-mapSize={[256, 256]}
        shadow-normalBias={0.04}
        shadow-bias={-0.0001}
      />
    </group>
  );
});

export function Scene({ brightness, isSwinging, lampIntensity, lampHue, setHoveredFurniture }) {
  // Calculate light intensity based on brightness prop (0 to 1)
  const ambientIntensity = brightness * 4.5;
  const mainLightIntensity = brightness * 30;
  const lampColor = `hsl(${lampHue}, 100%, 70%)`; // Dynamic color based on hue

  // Memoize materials to avoid recreation on every render
  const floorMaterial = useMemo(() => ({ color: "#333", roughness: 0.8 }), []);
  const backWallMaterial = useMemo(() => ({ color: "#554444", roughness: 1 }), []);
  const leftWallMaterial = useMemo(() => ({ color: "#222", roughness: 1 }), []);
  const rightWallMaterial = useMemo(() => ({ color: "#333", roughness: 1 }), []);
  const sofaMaterial = useMemo(() => ({ color: "#885555", roughness: 0.2 }), []);
  const tableMaterial = useMemo(() => ({ color: "#222", roughness: 0.2 }), []);
  const chairMaterial = useMemo(() => ({ color: "#555566", roughness: 0.2 }), []);
  const ottomanMaterial = useMemo(() => ({ color: "#665555", roughness: 0.2 }), []);
  const tvStandMaterial = useMemo(() => ({ color: "#111", roughness: 0.2 }), []);

  return (
    <>
      <SoftShadows size={25} samples={6} focus={0} />

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
        shadow-mapSize={[512, 512]}
        shadow-normalBias={0.04}
        shadow-bias={-0.0001}
      />

      <Selection>
        <EffectComposer autoClear={false} multisampling={4}>
          <Outline blur edgeStrength={10} width={1000} visibleEdgeColor="white" hiddenEdgeColor="white" />
        </EffectComposer>

        {/* Hanging Lamps */}
        <HangingLamp position={[-1.5, 0, -3]} brightness={brightness} color={lampColor} isSwinging={isSwinging} offset={0} intensity={lampIntensity} />
        <HangingLamp position={[0, 0, -3]} brightness={brightness} color={lampColor} isSwinging={isSwinging} offset={1} intensity={lampIntensity} />
        <HangingLamp position={[1.5, 0, -3]} brightness={brightness} color={lampColor} isSwinging={isSwinging} offset={2} intensity={lampIntensity} />

        {/* Wall Light on Left Wall */}
        <group position={[-4.8, 2, 0]}>
          {/* Wall sconce fixture - flat circular cover */}
          <Cylinder args={[0.3, 0.3, 0.1, 32]} rotation={[0, 0, Math.PI / 2]} castShadow={false}>
            <meshStandardMaterial color="white" emissive={lampColor} emissiveIntensity={brightness + lampIntensity * 0.5} />
          </Cylinder>
          {/* Wall light source */}
          <pointLight
            position={[0, 0, 0]}
            intensity={60 * lampIntensity}
            color={lampColor}
            distance={0}
            castShadow
            shadow-mapSize={[256, 256]}
            shadow-normalBias={0.04}
            shadow-bias={-0.0001}
          />
        </group>

        {/* Room Structure */}
        <group position={[0, -1.5, 0]}>
          {/* Floor */}
          <Plane
            args={[10, 10]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
          >
            <meshStandardMaterial {...floorMaterial} />
          </Plane>

          {/* Back Wall */}
          <Plane
            args={[10, 6]}
            position={[0, 3, -5]}
            receiveShadow
          >
            <meshStandardMaterial {...backWallMaterial} />
          </Plane>

          {/* Left Wall (Window side) */}
          <Plane
            args={[10, 6]}
            position={[-5, 3, 0]}
            rotation={[0, Math.PI / 2, 0]}
            receiveShadow
          >
            <meshStandardMaterial {...leftWallMaterial} />
          </Plane>

          {/* Right Wall */}
          <Plane
            args={[10, 6]}
            position={[5, 3, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            receiveShadow
          >
            <meshStandardMaterial {...rightWallMaterial} />
          </Plane>
        </group>

        {/* Furniture Placeholders */}
        <group position={[0, -1.5, 0]}>
          {/* Sofa */}
          <Furniture initialPosition={[2, 0.4, 3]} name="Sofa" setHoveredFurniture={setHoveredFurniture}>
            <Box args={[3, 0.8, 1.2]} castShadow receiveShadow>
              <meshStandardMaterial {...sofaMaterial} />
            </Box>
          </Furniture>

          {/* Coffee Table */}
          <Furniture initialPosition={[-0.5, 0.2, 2]} name="Coffee Table" setHoveredFurniture={setHoveredFurniture}>
            <Box args={[1.5, 0.4, 1]} castShadow receiveShadow>
              <meshStandardMaterial {...tableMaterial} />
            </Box>
          </Furniture>

          {/* Chair */}
          <Furniture initialPosition={[-2.5, 0.4, 0]} name="Chair" setHoveredFurniture={setHoveredFurniture}>
            <Box args={[1, 0.8, 1]} rotation={[0, 0.5, 0]} castShadow receiveShadow>
              <meshStandardMaterial {...chairMaterial} />
            </Box>
          </Furniture>

          {/* Ottoman */}
          <Furniture initialPosition={[-2.2, 0.25, 1.5]} name="Ottoman" setHoveredFurniture={setHoveredFurniture}>
            <Box args={[0.8, 0.5, 0.8]} rotation={[0, 0.2, 0]} castShadow receiveShadow>
              <meshStandardMaterial {...ottomanMaterial} />
            </Box>
          </Furniture>

          {/* TV Stand / Cabinet */}
          <Furniture initialPosition={[0, 0.3, -4]} name="TV Stand" setHoveredFurniture={setHoveredFurniture}>
            <Box args={[6, 0.6, 0.8]} castShadow receiveShadow>
              <meshStandardMaterial {...tvStandMaterial} />
            </Box>
          </Furniture>
        </group>
      </Selection>
    </>
  );
}
