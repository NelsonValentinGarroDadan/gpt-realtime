// app/components/ChatInterface.tsx
'use client';

import { useRealtime } from '../hooks/useRealtime';
import { useState } from 'react';

export default function ChatInterface() {
  const { isConnected, isRecording, isSpeaking, transcript, llmResponse, start, stop, sendText } = useRealtime();
  const [inputText, setInputText] = useState('');

  const handleSendText = () => {
    if (inputText.trim()) {
      sendText(inputText);
      setInputText('');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-gray-800 rounded-xl shadow-md flex flex-col space-y-4">
      <h1 className="text-2xl font-bold text-white text-center">Ejemplo Real-time OpenAI</h1>

      {/* --- Controles de Conexión --- */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={start}
          disabled={isConnected}
          className="px-4 py-2 font-semibold text-white bg-green-600 rounded-lg disabled:bg-gray-500 hover:bg-green-700 transition-colors"
        >
          Conectar y Hablar
        </button>
        <button
          onClick={stop}
          disabled={!isConnected}
          className="px-4 py-2 font-semibold text-white bg-red-600 rounded-lg disabled:bg-gray-500 hover:bg-red-700 transition-colors"
        >
          Detener
        </button>
      </div>

      {/* --- Indicadores de Estado --- */}
      <div className="flex justify-around p-2 bg-gray-700 rounded-lg text-sm">
        <p>Conexión: <span className={`font-bold ${isConnected ? 'text-green-400' : 'text-red-400'}`}>{isConnected ? 'Activa' : 'Inactiva'}</span></p>
        <p>Grabando: <span className={`font-bold ${isRecording ? 'text-green-400' : 'text-red-400'}`}>{isRecording ? 'Sí' : 'No'}</span></p>
        <p>Hablando: <span className={`font-bold ${isSpeaking ? 'text-yellow-400' : 'text-gray-400'}`}>{isSpeaking ? 'Sí' : 'No'}</span></p>
      </div>

      {/* --- Área de Transcripción y Respuestas --- */}
      <div className="space-y-2 p-4 bg-gray-900 rounded-lg h-40 overflow-y-auto">
        <p className="text-gray-400">Tú dijiste: <span className="text-white font-medium">{transcript}</span></p>
        <p className="text-gray-400">LLM dice: <span className="text-cyan-300 font-medium">{llmResponse}</span></p>
      </div>

      {/* --- Entrada de Texto (Alternativa a la voz) --- */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isConnected ? 'O escribe un mensaje...' : 'Conéctate para escribir'}
          disabled={!isConnected}
          className="flex-grow p-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
        <button
          onClick={handleSendText}
          disabled={!isConnected}
          className="px-4 py-2 font-semibold text-white bg-cyan-600 rounded-lg disabled:bg-gray-500 hover:bg-cyan-700 transition-colors"
        >
          Enviar
        </button>
      </div>
       <div className="text-xs text-gray-400 text-center">
        <p>Prueba a decir: cuéntame un chiste de programadores</p>
      </div>
    </div>
  );
}
