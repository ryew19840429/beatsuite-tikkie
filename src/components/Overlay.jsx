import React from 'react';
import { motion } from 'framer-motion';

export function Overlay({ brightness, setBrightness, isSwinging, setIsSwinging }) {
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
            padding: '40px',
            boxSizing: 'border-box',
            zIndex: 10
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                style={{
                    pointerEvents: 'auto',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    maxWidth: '400px',
                    width: '100%'
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
        </div>
    );
}
