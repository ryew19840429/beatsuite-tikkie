import React from 'react';
import { NurseChat } from './components/NurseChat';

const App: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Health Companion</h1>
        <p className="text-slate-600 max-w-md mx-auto">
          Talk to your AI nurse to analyze stress and get real-time health advice.
        </p>
      </header>
      
      <main className="w-full max-w-2xl">
         <NurseChat />
      </main>

      <footer className="mt-12 text-slate-400 text-sm">
        <p>Powered by Gemini Live API</p>
      </footer>
    </div>
  );
};

export default App;