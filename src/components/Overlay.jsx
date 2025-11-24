import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Overlay({ brightness, setBrightness, isSwinging, setIsSwinging, lampIntensity, setLampIntensity, lampHue, setLampHue, hoveredFurniture }) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let rafId = null;
        let lastMousePos = { x: 0, y: 0 };

        const handleMouseMove = (e) => {
            lastMousePos = { x: e.clientX, y: e.clientY };

            if (!rafId) {
                rafId = requestAnimationFrame(() => {
                    setMousePos(lastMousePos);
                    rafId = null;
                });
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, []);
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                style={{
                    width: '220px',
                    boxSizing: 'border-box',
                    pointerEvents: 'auto',
                    background: 'rgba(20, 20, 20, 0.9)',
                    backdropFilter: 'blur(10px)',
                    padding: '20px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >



                <div className="control-group" style={{ marginTop: '0.5rem' }}>
                    <label style={{ color: '#888', marginBottom: '4px', display: 'block', fontSize: '0.7rem' }}>INTENSITY</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1rem' }}>💡</span>
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={lampIntensity}
                            onChange={(e) => setLampIntensity(parseFloat(e.target.value))}
                            style={{
                                flex: 1,
                                accentColor: 'white',
                                cursor: 'pointer',
                                width: '100%'
                            }}
                        />
                        <span style={{ fontSize: '1rem' }}>🔥</span>
                    </div>
                </div>

                <div className="control-group" style={{ marginTop: '1rem' }}>
                    <label style={{ color: '#888', marginBottom: '4px', display: 'block', fontSize: '0.7rem' }}>COLOR</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: `hsl(${lampHue}, 100%, 50%)`,
                            border: '2px solid white',
                            flexShrink: 0
                        }} />
                        <input
                            type="range"
                            min="0"
                            max="360"
                            value={lampHue}
                            onChange={(e) => setLampHue(parseFloat(e.target.value))}
                            style={{
                                flex: 1,
                                accentColor: 'white',
                                cursor: 'pointer',
                                background: 'linear-gradient(to right, red, orange, yellow, green, blue, indigo, violet, red)',
                                appearance: 'none',
                                height: '4px',
                                borderRadius: '2px',
                                width: '100%'
                            }}
                        />
                    </div>
                </div>


            </motion.div>

            {/* Tooltip */}
            {hoveredFurniture && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        left: `${mousePos.x + 15}px`,
                        top: `${mousePos.y + 15}px`,
                        background: 'rgba(255, 255, 255, 0.95)',
                        color: '#000',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '0.95rem',
                        fontWeight: 500,
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        zIndex: 100,
                        whiteSpace: 'nowrap'
                    }}
                >
                    {hoveredFurniture}
                </motion.div>
            )}
        </>
    );
}
