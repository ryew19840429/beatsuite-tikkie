import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Scene } from './components/Scene';
import { Overlay } from './components/Overlay';

function App() {
  const [brightness, setBrightness] = useState(0.5);

  return (
    <>
      <Canvas
        shadows
        camera={{ position: [0, 2, 8], fov: 50 }}
        style={{ background: '#050505' }}
      >
        <Suspense fallback={null}>
          <Scene brightness={brightness} />
        </Suspense>
      </Canvas>

      <Overlay brightness={brightness} setBrightness={setBrightness} />
    </>
  );
}

export default App;
