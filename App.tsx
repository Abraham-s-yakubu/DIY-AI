import React, { useState, useCallback } from 'react';
import type { Solution } from './types';
import type { Chat } from '@google/genai';
import { getFixItSolution, startChatSession } from './services/geminiService';
import InputForm from './components/InputForm';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import SolutionDisplay from './components/SolutionDisplay';
import { CloseIcon } from './components/icons';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, showCloseButton = true }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 transition-opacity duration-300 ease-in-out animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col transition-transform duration-300 ease-in-out animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {showCloseButton && onClose && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
            aria-label="Close"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        )}
        <div className="p-6 md:p-8 overflow-y-auto">
            {children}
        </div>
        {showCloseButton && onClose && (
             <div className="flex-shrink-0 px-6 py-4 bg-gray-50 border-t border-gray-200 text-right rounded-b-lg">
                <button
                    onClick={onClose}
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Done
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

const Header: React.FC = () => (
  <header className="text-center mb-8 pt-4">
    <h1 className="text-3xl md:text-4xl font-google-sans font-bold text-gray-800 tracking-tight">
      <span style={{color: '#4285F4'}}>D</span>
      <span style={{color: '#EA4335'}}>I</span>
      <span style={{color: '#FBBC05'}}>Y</span>
      <span style={{color: '#4285F4'}}>-</span>
      <span style={{color: '#34A853'}}>A</span>
      <span style={{color: '#EA4335'}}>I</span>
      <span className="text-gray-800"> Fix-It</span>
    </h1>
    <p className="mt-2 text-base text-gray-600 max-w-2xl mx-auto">
      Your AI assistant for household repairs.
    </p>
  </header>
);

const App: React.FC = () => {
  const [solution, setSolution] = useState<Solution | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);

  const handleSubmit = useCallback(async (imageBase64: string, mimeType: string, problemDescription: string) => {
    setIsLoading(true);
    setError(null);
    setSolution(null);
    setChat(null);
    try {
      const result = await getFixItSolution(imageBase64, mimeType, problemDescription);
      setSolution(result);
      
      const context = `
        Problem Description: ${problemDescription}
        Solution Provided: ${JSON.stringify(result, null, 2)}
      `;
      const chatSession = startChatSession(context);
      setChat(chatSession);

    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = () => {
    setSolution(null);
    setError(null);
    setIsLoading(false);
    setChat(null);
  };

  return (
    <div className="min-h-screen text-gray-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <Header />
        <main>
          <InputForm onSubmit={handleSubmit} />
        </main>
        
        <Modal isOpen={isLoading} showCloseButton={false}>
            <LoadingSpinner />
        </Modal>
        
        <Modal isOpen={!!error} onClose={handleReset}>
            {error && <ErrorAlert message={error} />}
        </Modal>

        <Modal isOpen={!!solution} onClose={handleReset}>
            {solution && <SolutionDisplay solution={solution} chat={chat} />}
        </Modal>

        <footer className="text-center mt-12 text-sm text-gray-500">
          <p>Powered by Google Gemini. AI-generated advice should be used with caution.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
