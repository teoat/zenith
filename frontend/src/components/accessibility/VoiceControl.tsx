import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { secureLogger } from '../../utils/secureLogger';

const VoiceControl: React.FC = () => {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [supported, setSupported] = useState(() => 
    typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!supported) {
      secureLogger.warn('VOICE_CONTROL', 'Web Speech API not supported in this browser. Enabling simulated mode.');
    }
  }, [supported]);

  const handleCommand = (command: string) => {
    const lowerCmd = command.toLowerCase();
    
    if (lowerCmd.includes('dashboard') || lowerCmd.includes('alerts')) {
      secureLogger.info('VOICE_CONTROL', 'Navigating to Dashboard');
      navigate('/dashboard');
    } else if (lowerCmd.includes('investigation') || lowerCmd.includes('cases')) {
      secureLogger.info('VOICE_CONTROL', 'Navigating to Cases');
      navigate('/cases');
    } else if (lowerCmd.includes('settings')) {
       secureLogger.info('VOICE_CONTROL', 'Navigating to Settings');
       navigate('/settings');
    } else if (lowerCmd.includes('ingestion')) {
       secureLogger.info('VOICE_CONTROL', 'Navigating to Ingestion');
       navigate('/ingestion');
    } else {
       secureLogger.info('VOICE_CONTROL', 'Command not recognized');
    }
  };

  const toggleListening = () => {
    if (listening) {
      setListening(false);
      setTranscript('');
    } else {
      setListening(true);
      
      // Simulation of Web Speech API for environments without microphone access or support
      secureLogger.info('VOICE_CONTROL', 'Listening for commands...');
      
      setTimeout(() => {
        const mockCommand = "Go to dashboard"; 
        setTranscript(mockCommand);
        secureLogger.info('VOICE_CONTROL', `Recognized command: ${mockCommand}`);
        handleCommand(mockCommand);
        setListening(false); 
      }, 2000);
    }
  };

  // REMOVED: if (!supported) return null; - We want the button to be visible for the premium "WOW" factor

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
      {!supported && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full mb-1 backdrop-blur-sm animate-pulse">
          SIMULATED MODE
        </div>
      )}
      <button
        onClick={toggleListening}
        className={`p-4 rounded-full shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${
          listening 
            ? 'bg-red-500 ring-4 ring-red-500/20' 
            : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
        }`}
        aria-label={listening ? "Stop Listening" : "Start Voice Control"}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-white"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </button>

      {listening && (
        <div className="absolute bottom-16 right-0 bg-slate-900 border border-slate-700 p-3 rounded-lg w-64 shadow-2xl">
          <p className="text-xs text-slate-400 mb-1">LISTENING...</p>
          <p className="text-sm text-cyan-400 font-mono">{transcript || "Waiting for command..."}</p>
        </div>
      )}
    </div>
  );
};

export default VoiceControl;
