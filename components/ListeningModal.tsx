import React from 'react';
import { MicrophoneIcon } from './icons';

interface ListeningModalProps {
  isOpen: boolean;
  transcript: string;
  onStop: () => void;
}

const ListeningModal: React.FC<ListeningModalProps> = ({ isOpen, transcript, onStop }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Listening...</h2>
        <div className="relative flex items-center justify-center h-40 w-40">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse-slow"></div>
            <div className="relative h-24 w-24 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
                <MicrophoneIcon className="h-12 w-12" />
            </div>
        </div>

        <p className="mt-6 text-lg text-gray-600 min-h-[2.5em] max-w-xl mx-auto">
            {transcript || 'Say something...'}
        </p>

        <button
            onClick={onStop}
            type="button"
            className="mt-8 px-8 py-3 text-lg font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
            Done
        </button>
      </div>
    </div>
  );
};

export default ListeningModal;