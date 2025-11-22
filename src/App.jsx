import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';
import { ChatInterface } from './components/ChatInterface';
import MusicGenerator from './components/MusicGenerator';

import CircadianClock from './components/CircadianClock';

function App() {
  const [brightness, setBrightness] = useState(0);
  const [isSwinging, setIsSwinging] = useState(false);
  const [lampIntensity, setLampIntensity] = useState(1);
  const [lampHue, setLampHue] = useState(30); // Default warm orange
  const [hoveredFurniture, setHoveredFurniture] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <>
      <MusicGenerator
        setLampIntensity={setLampIntensity}
        setLampHue={setLampHue}
      />
      <CircadianClock
        setLampIntensity={setLampIntensity}
        setLampHue={setLampHue}
      />
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{ background: '#050505' }}
      >
        <Suspense fallback={null}>
          <Scene
            brightness={brightness}
            isSwinging={isSwinging}
            lampIntensity={lampIntensity}
            lampHue={lampHue}
            setHoveredFurniture={setHoveredFurniture}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
          />
        </Suspense>
      </Canvas>

      <Overlay
        brightness={brightness}
        setBrightness={setBrightness}
        isSwinging={isSwinging}
        setIsSwinging={setIsSwinging}
        lampIntensity={lampIntensity}
        setLampIntensity={setLampIntensity}
        lampHue={lampHue}
        setLampHue={setLampHue}
        hoveredFurniture={hoveredFurniture}
      />

      <ChatInterface
        setLampIntensity={setLampIntensity}
        setLampHue={setLampHue}
        setBrightness={setBrightness}
      />
    </>
  );
}

export default App;
