import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';

export function ChatInterface({ setLampIntensity, setLampHue, setBrightness }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const ai = useMemo(() => new GoogleGenAI({ apiKey: 'AIzaSyCAFbR9R2MEi7D2aw5CP4EtQgJamScEdkY' }), []);

    useEffect(() => {
        if (isOpen) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, isOpen]);

    const parseAIResponse = (text) => {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (e) {
                return null;
            }
        }
        return null;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const prompt = `You are a smart home assistant controlling lamp settings. The user can control:
- lampIntensity: 0 to 3 (default 1)
- lampHue: 0 to 360 (color in HSL, 0=red, 30=orange, 60=yellow, 120=green, 180=cyan, 240=blue, 300=magenta)
- brightness: 0 to 1 (ambient room brightness)

User request: "${userMessage}"

Respond with a JSON object containing the values to set, and a friendly message. Example:
{
  "lampIntensity": 2,
  "lampHue": 240,
  "brightness": 0.7,
  "message": "I've set the lamps to blue with medium-high intensity!"
}

Only include properties that should change. If the user just wants information, only include "message".`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-lite',
                contents: prompt,
            });
            // Extract text safely – the SDK may return .text or nested candidate parts
            const responseText = response.text ?? response?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            const parsed = parseAIResponse(responseText);

            if (parsed) {
                if (parsed.lampIntensity !== undefined) setLampIntensity(parsed.lampIntensity);
                if (parsed.lampHue !== undefined) setLampHue(parsed.lampHue);
                if (parsed.brightness !== undefined) setBrightness(parsed.brightness);

                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: parsed.message || 'Settings updated!'
                }]);
            } else {
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: responseText
                }]);
            }
        } catch (error) {
            console.error('Error calling Gemini API:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 100
        }}>
            <>
                {!isOpen ? (
                    <motion.button
                        key="button"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.1 }}
                        onClick={() => setIsOpen(true)}
                        style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            color: 'white',
                            fontSize: '24px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        💬
                    </motion.button>
                ) : (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            width: '350px',
                            height: '500px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                        }}
                    >
                        <div style={{
                            padding: '16px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>AI Lamp Control</h3>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                    padding: '4px 8px'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {messages.length === 0 && (
                                <div style={{
                                    color: 'rgba(255, 255, 255, 0.6)',
                                    textAlign: 'center',
                                    marginTop: '20px',
                                    fontSize: '0.9rem'
                                }}>
                                    Try: "Make lamps blue" or "Set brightness to 50%"
                                </div>
                            )}
                            {messages.map((msg, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                        maxWidth: '80%'
                                    }}
                                >
                                    <div style={{
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        background: msg.role === 'user'
                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            : 'rgba(255, 255, 255, 0.15)',
                                        color: 'white',
                                        fontSize: '0.9rem',
                                        wordWrap: 'break-word'
                                    }}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div style={{ alignSelf: 'flex-start' }}>
                                    <div style={{
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        color: 'white',
                                        fontSize: '0.9rem'
                                    }}>
                                        Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div style={{
                            padding: '16px',
                            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            gap: '8px'
                        }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Type a command..."
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    padding: '10px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    fontSize: '0.9rem',
                                    outline: 'none'
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    cursor: isLoading || !input.trim() ? 'not-allowed' : 'pointer',
                                    opacity: isLoading || !input.trim() ? 0.5 : 1,
                                    fontSize: '0.9rem',
                                    fontWeight: 500
                                }}
                            >
                                Send
                            </button>
                        </div>
                    </motion.div>
                )}
            </>
        </div>
    );
}
