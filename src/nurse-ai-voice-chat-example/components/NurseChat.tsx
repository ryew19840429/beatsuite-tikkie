import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { StressLevel } from '../types';
import { createPcmBlob, decodeAudioData } from '../utils/audioUtils';

// Tool definition to allow the AI to update the UI
const updateStatusFunction: FunctionDeclaration = {
  name: 'updatePatientStatus',
  description: 'Update the patient\'s detected stress or emotional level based on their voice and tone.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      status: {
        type: Type.STRING,
        enum: [
          StressLevel.NEUTRAL,
          StressLevel.CALM,
          StressLevel.STRESSED,
          StressLevel.ANXIOUS,
          StressLevel.HAPPY
        ],
        description: 'The detected emotional state of the patient.',
      },
    },
    required: ['status'],
  },
};

export const NurseChat: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [stressLevel, setStressLevel] = useState<StressLevel>(StressLevel.UNKNOWN);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState(0); // For visualizer

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  
  // Audio Playback Queue Refs
  const nextStartTimeRef = useRef<number>(0);
  const scheduledSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Gemini Session Refs
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Initialize Audio Contexts
  const ensureAudioContexts = () => {
    if (!inputAudioContextRef.current) {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
    if (!outputAudioContextRef.current) {
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
  };

  const stopAudio = useCallback(() => {
    // Stop microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Disconnect script processor
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }

    // Stop all playing audio
    scheduledSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    scheduledSourcesRef.current.clear();
    nextStartTimeRef.current = 0;

    // Close input context to release mic lock
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
       inputAudioContextRef.current.close().then(() => {
          inputAudioContextRef.current = null;
       });
    }
    
    setIsActive(false);
  }, []);

  const startSession = async () => {
    setError(null);
    ensureAudioContexts();
    
    // Resume contexts if suspended (browser policy)
    if (inputAudioContextRef.current?.state === 'suspended') {
      await inputAudioContextRef.current.resume();
    }
    if (outputAudioContextRef.current?.state === 'suspended') {
      await outputAudioContextRef.current.resume();
    }

    try {
      // 1. Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // 3. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are a professional, compassionate, and observant nurse. 
          Your goal is to check in on the patient's well-being.
          IMMEDIATELY upon starting the conversation, say exactly: "Hi, I'm your nurse, how are you feeling today?" in a warm voice.
          As you listen to the user, analyze their voice tone and word choice.
          Use the 'updatePatientStatus' tool to update the dashboard if you detect they are Stressed, Anxious, Happy, Calm, or Neutral.
          Keep your responses concise, empathetic, and supportive.`,
          tools: [{ functionDeclarations: [updateStatusFunction] }],
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Session Opened");
            setIsActive(true);
            setStressLevel(StressLevel.NEUTRAL); // Reset to neutral on start
            
            // Start Audio Capture Loop
            if (!inputAudioContextRef.current || !streamRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(streamRef.current);
            sourceRef.current = source;
            
            // ScriptProcessor for raw PCM access (bufferSize, inputChannels, outputChannels)
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            scriptProcessorRef.current = processor;

            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Simple volume meter logic
              let sum = 0;
              for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(rms * 10, 1)); // Scale for visualizer

              // Send to Gemini
              const pcmBlob = createPcmBlob(inputData);
              if (sessionPromiseRef.current) {
                 sessionPromiseRef.current.then(session => {
                    session.sendRealtimeInput({ media: pcmBlob });
                 });
              }
            };

            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Tool Calls (Stress Level Updates)
            if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                    if (fc.name === 'updatePatientStatus') {
                         const newStatus = (fc.args as any).status;
                         if (newStatus) {
                             setStressLevel(newStatus);
                         }
                         // Send response back to acknowledge
                         if (sessionPromiseRef.current) {
                             sessionPromiseRef.current.then(session => {
                                 session.sendToolResponse({
                                     functionResponses: {
                                         id: fc.id,
                                         name: fc.name,
                                         response: { result: "Status updated" }
                                     }
                                 });
                             });
                         }
                    }
                }
            }

            // Handle Audio Response
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                const audioBuffer = await decodeAudioData(base64Audio, ctx);
                
                // Gapless Playback Logic
                // If nextStartTime is in the past, reset it to current time to play immediately
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                
                source.start(nextStartTimeRef.current);
                scheduledSourcesRef.current.add(source);
                
                source.onended = () => {
                    scheduledSourcesRef.current.delete(source);
                };
                
                // Increment time for next chunk
                nextStartTimeRef.current += audioBuffer.duration;
            }
          },
          onclose: () => {
            console.log("Session Closed");
            setIsActive(false);
          },
          onerror: (err) => {
            console.error("Session Error", err);
            setError("Connection failed. Please try again.");
            stopAudio();
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to start audio session");
      stopAudio();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then(session => session.close());
      }
    };
  }, [stopAudio]);

  // Determine status badge color
  const getStatusColor = (level: StressLevel) => {
      switch(level) {
          case StressLevel.CALM: return 'bg-emerald-100 text-emerald-800 border-emerald-200';
          case StressLevel.HAPPY: return 'bg-blue-100 text-blue-800 border-blue-200';
          case StressLevel.STRESSED: return 'bg-red-100 text-red-800 border-red-200';
          case StressLevel.ANXIOUS: return 'bg-orange-100 text-orange-800 border-orange-200';
          default: return 'bg-slate-100 text-slate-800 border-slate-200';
      }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-md mx-auto p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-blue-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Nurse AI Assistant</h2>
        <p className="text-slate-500 mt-2">Real-time health & mood check-in</p>
      </div>

      {/* Main Action Area */}
      <div className="relative mb-8 flex justify-center items-center">
        {/* Visualizer Ring (active only when active) */}
        {isActive && (
             <div className="absolute w-32 h-32 rounded-full border-4 border-blue-100 opacity-50 animate-ping"></div>
        )}
        
        <button
            onClick={isActive ? stopAudio : startSession}
            className={`
                relative z-10 flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 shadow-lg
                ${isActive 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                }
            `}
        >
            {isActive ? (
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
            ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
            )}
        </button>

        {/* Volume Indicator Overlay */}
        {isActive && (
            <div 
                className="absolute w-24 h-24 rounded-full border-2 border-white opacity-40 pointer-events-none"
                style={{ transform: `scale(${1 + volume})` }}
            />
        )}
      </div>

      {/* Status Label */}
      <div className="text-center w-full">
         <p className="text-sm font-medium text-slate-400 mb-3 uppercase tracking-wider">Current State</p>
         <div className={`inline-flex items-center px-4 py-2 rounded-full border ${getStatusColor(stressLevel)} transition-colors duration-500`}>
             <span className="w-2 h-2 rounded-full bg-current mr-2 animate-pulse"></span>
             <span className="font-semibold">{stressLevel}</span>
         </div>
      </div>

      {/* Text Feedback */}
      <div className="mt-8 text-center h-6">
        {isActive ? (
            <p className="text-sm text-slate-500 animate-pulse">Listening to your voice...</p>
        ) : (
            <p className="text-sm text-slate-400">Tap the microphone to start checking in.</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg w-full text-center">
            {error}
        </div>
      )}

    </div>
  );
};