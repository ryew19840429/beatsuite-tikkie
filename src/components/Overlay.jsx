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
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            alignItems: 'flex-end',
            padding: '30px',
            boxSizing: 'border-box',
            zIndex: 10
        }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                style={{
                    width: '360px',
                    boxSizing: 'border-box',
                    pointerEvents: 'auto',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                <h1 style={{
                    margin: '0 0 16px 0',
                    fontSize: '1.2rem',
                    fontWeight: 500,
                    color: 'white'
                }}>
                    Room Ambiance
                </h1>

                <div className="control-group">
                    <label style={{ color: 'white', marginBottom: '8px', display: 'block' }}>Brightness</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🌑</span>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={brightness}
                            onChange={(e) => setBrightness(parseFloat(e.target.value))}
                            style={{
                                flex: 1,
                                accentColor: 'white',
                                cursor: 'pointer'
                            }}
                        />
                        <span style={{ fontSize: '1.2rem' }}>☀️</span>
                    </div>
                </div>

                <div className="control-group" style={{ marginTop: '1rem' }}>
                    <label style={{ color: 'white', marginBottom: '8px', display: 'block' }}>Lamp Intensity</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '1.2rem' }}>💡</span>
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
                                cursor: 'pointer'
                            }}
                        />
                        <span style={{ fontSize: '1.2rem' }}>🔥</span>
                    </div>
                </div>

                <div className="control-group" style={{ marginTop: '1rem' }}>
                    <label style={{ color: 'white', marginBottom: '8px', display: 'block' }}>Lamp Color</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: `hsl(${lampHue}, 100%, 50%)`,
                            border: '2px solid white'
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
                                height: '6px',
                                borderRadius: '3px'
                            }}
                        />
                    </div>
                </div>

                <div className="control-group" style={{ marginTop: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'white' }}>
                        <input
                            type="checkbox"
                            checked={isSwinging}
                            onChange={(e) => setIsSwinging(e.target.checked)}
                            style={{ accentColor: 'white' }}
                        />
                        Swinging Lights
                    </label>
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
        </div>
    );
}
