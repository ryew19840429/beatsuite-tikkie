import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';

function App() {
  const [brightness, setBrightness] = useState(0.5);
  const [isSwinging, setIsSwinging] = useState(false);
  const [lampIntensity, setLampIntensity] = useState(1);
  const [lampHue, setLampHue] = useState(30); // Default warm orange

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{ background: '#050505' }}
      >
        <Suspense fallback={null}>
          <Scene brightness={brightness} isSwinging={isSwinging} lampIntensity={lampIntensity} lampHue={lampHue} />
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
      />
    </>
  );
}

export default App;
