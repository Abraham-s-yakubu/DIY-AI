import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CameraIcon, MicrophoneIcon } from './icons';
import ListeningModal from './ListeningModal';

// Fix: Add type definitions for the Web Speech API to resolve TypeScript errors.
// These types are not included in the default TypeScript DOM library.
interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: {
    transcript: string;
  };
}
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResult[];
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

interface InputFormProps {
  onSubmit: (imageBase64: string, mimeType: string, problemDescription: string) => void;
}

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });

const examples = [
    { name: "Leaky Faucet", text: "My kitchen sink faucet is dripping constantly from the spout, even when turned off completely." },
    { name: "Jammed Disposal", text: "My garbage disposal hums but doesn't spin when I turn it on. I think something is stuck." },
    { name: "Drywall Hole", text: "There's a small hole in my wall, about the size of a doorknob, that I need to patch up." },
];

const InputForm: React.FC<InputFormProps> = ({ onSubmit }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [problemDescription, setProblemDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const hasSpeechRecognition = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!hasSpeechRecognition) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setError(`Speech recognition error: ${event.error}. Please ensure microphone access is allowed.`);
        setIsListening(false);
    };

    recognition.onend = () => {
        setIsListening(false);
    };
    
    recognitionRef.current = recognition;

    return () => {
        recognitionRef.current?.stop();
    };
  }, [hasSpeechRecognition]);

  const handleStartListening = () => {
    if (!hasSpeechRecognition || isListening) return;
    setTranscript('');
    try {
        recognitionRef.current?.start();
        setIsListening(true);
    } catch (e) {
        console.error("Could not start recognition", e);
        setError("Could not start voice recognition. Please check microphone permissions.");
    }
  };

  const handleStopListening = () => {
    if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        setProblemDescription(prev => (prev ? prev.trim() + ' ' : '') + transcript.trim());
        setTranscript('');
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file.');
        return;
      }
      setError(null);
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please drop a valid image file.');
        return;
      }
      setError(null);
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isListening) {
      handleStopListening();
    }
    if (!imageFile) {
      setError('Please upload an image of the problem.');
      return;
    }
    if (!problemDescription.trim()) {
      setError('Please describe the problem.');
      return;
    }
    setError(null);
    try {
      const base64 = await fileToBase64(imageFile);
      onSubmit(base64, imageFile.type, problemDescription);
    } catch (e) {
      setError('Could not process the image file.');
    }
  };

  return (
    <>
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">1. Upload a Photo</label>
            <label 
              htmlFor="file-upload" 
              className="mt-2 flex justify-center w-full h-64 px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors bg-gray-50 relative"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Problem preview" className="h-full w-full object-contain rounded-md" />
              ) : (
                <div className="space-y-1 text-center flex flex-col items-center justify-center">
                  <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <p className="pl-1">Drag & drop an image, or click to upload</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                </div>
              )}
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" ref={fileInputRef} />
            </label>
          </div>

          <div>
            <label htmlFor="description" className="block text-lg font-semibold text-gray-700 mb-2">2. Describe the Problem</label>
            <div className="mt-1">
              <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 placeholder-gray-400"
                  placeholder="e.g., 'My kitchen sink is leaking...'"
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
              />
            </div>
            {hasSpeechRecognition && (
                <div className="mt-4 flex flex-col items-center">
                    <p className="text-sm text-gray-500 mb-2">or</p>
                    <button
                        type="button"
                        onClick={handleStartListening}
                        className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105"
                        aria-label="Start recording"
                    >
                        <MicrophoneIcon className="h-8 w-8" />
                    </button>
                </div>
            )}
          </div>
          
          <div className="text-sm">
              <span className="text-gray-500 mr-2">Try an example:</span>
              <div className="inline-flex gap-2 flex-wrap">
                  {examples.map((ex) => (
                      <button 
                          key={ex.name} 
                          type="button" 
                          onClick={() => setProblemDescription(ex.text)}
                          className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 disabled:opacity-50"
                      >
                          {ex.name}
                      </button>
                  ))}
              </div>
          </div>
          
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={!imageFile || !problemDescription}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Get Fix-It Plan
            </button>
          </div>
        </form>
      </div>
      <ListeningModal 
        isOpen={isListening} 
        transcript={transcript} 
        onStop={handleStopListening} 
      />
    </>
  );
};

export default InputForm;