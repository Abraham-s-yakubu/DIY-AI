import React, { useState, useCallback, useEffect, useMemo } from 'react';
import type { Solution } from '../types';
import type { Chat } from '@google/genai';
import { LightbulbIcon, ToolIcon, CheckCircleIcon, WarningIcon, ClipboardIcon, ClipboardCheckIcon, PlayIcon, PauseIcon, StopIcon, ClockIcon, ChartBarIcon, MagnifyingGlassIcon, CameraIcon, ShieldCheckIcon } from './icons';
import ChatComponent from './Chat';

const useCopyToClipboard = (): [boolean, (text: string) => void] => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback((text: string) => {
    if (isCopied) return;
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    });
  }, [isCopied]);

  return [isCopied, copy];
};

const CopyButton: React.FC<{ textToCopy: string, className?: string }> = ({ textToCopy, className }) => {
    const [isCopied, copy] = useCopyToClipboard();
    return (
        <button onClick={() => copy(textToCopy)} className={`transition-all duration-200 ${className}`}>
            {isCopied ? (
                <ClipboardCheckIcon className="h-5 w-5 text-green-500" />
            ) : (
                <ClipboardIcon className="h-5 w-5 text-gray-400 hover:text-blue-600" />
            )}
        </button>
    );
};

const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const speak = useCallback((text: string) => {
    if (!synth || synth.speaking) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onpause = () => {
      setIsSpeaking(true);
      setIsPaused(true);
    };
    utterance.onresume = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    utterance.onerror = (e) => {
      console.error("Speech synthesis error", e);
      setIsSpeaking(false);
      setIsPaused(false);
    }
    synth.speak(utterance);
  }, [synth]);

  const pause = useCallback(() => {
    synth?.pause();
  }, [synth]);

  const resume = useCallback(() => {
    synth?.resume();
  }, [synth]);

  const cancel = useCallback(() => {
    synth?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [synth]);

  useEffect(() => {
    return () => {
      if (synth?.speaking) {
        synth.cancel();
      }
    };
  }, [synth]);

  return { isSpeaking, isPaused, speak, pause, resume, cancel, isSupported: !!synth };
};

const riskColorMap = {
    'Low': 'text-green-700 bg-green-100',
    'Medium': 'text-yellow-700 bg-yellow-100',
    'High': 'text-red-700 bg-red-100',
};

const riskIconColorMap = {
    'Low': 'text-green-500',
    'Medium': 'text-yellow-500',
    'High': 'text-red-500',
};


interface SolutionDisplayProps {
  solution: Solution;
  chat: Chat | null;
  onFindPartClick: () => void;
  currentStepIndex: number;
  onCheckWork: (stepIndex: number) => void;
}

const SolutionDisplay: React.FC<SolutionDisplayProps> = ({ solution, chat, onFindPartClick, currentStepIndex, onCheckWork }) => {
  const { isSpeaking, isPaused, speak, pause, resume, cancel, isSupported } = useTextToSpeech();
    
  const fullTextToSpeak = useMemo(() => {
      if (!solution.diagnosis || !solution.difficulty || !solution.estimatedTime || !solution.tools || !solution.instructions || !solution.potentialPitfalls) {
        return "";
      }
      const diagnosis = `Diagnosis: ${solution.diagnosis}`;
      const difficulty = `The difficulty is ${solution.difficulty} and it should take about ${solution.estimatedTime}.`;
      const tools = solution.tools.length > 0
          ? `Tools needed: ${solution.tools.join(', ')}.`
          : 'No special tools are required.';
      const instructions = `Instructions: ${solution.instructions.map((step, index) => `Step ${index + 1}. ${step}`).join(' ')}`;
      const pitfalls = solution.potentialPitfalls.length > 0 
          ? `Be aware of these potential pitfalls: ${solution.potentialPitfalls.join('. ')}`
          : '';

      return [diagnosis, difficulty, tools, instructions, pitfalls].join('\n\n');
  }, [solution]);
  
  const handlePlayPause = () => {
      if (!isSpeaking) {
          speak(fullTextToSpeak);
      } else if (isPaused) {
          resume();
      } else {
          pause();
      }
  };

  if (!solution.diagnosis || !solution.instructions) {
    // This case should be handled by App.tsx, but as a fallback:
    return <div className="text-center p-4">Could not display the solution.</div>;
  }

  return (
    <div className="w-full text-left">
      <div className="flex flex-wrap justify-between items-center border-b border-gray-200 pb-4 mb-6 gap-4">
        <h2 className="text-3xl font-bold text-gray-800">Your Fix-It Plan</h2>
        <div className="flex items-center gap-4">
            {isSupported && (
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Read Aloud:</span>
                    <button onClick={handlePlayPause} className="p-2 rounded-full text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors" aria-label={isSpeaking && !isPaused ? "Pause" : "Play"}>
                        {isSpeaking && !isPaused ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                    </button>
                    {isSpeaking && (
                        <button onClick={cancel} className="p-2 rounded-full text-gray-600 bg-gray-200 hover:bg-gray-300 transition-colors" aria-label="Stop">
                            <StopIcon className="h-5 w-5" />
                        </button>
                    )}
                </div>
            )}
             <button 
                onClick={onFindPartClick} 
                className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm"
            >
                <MagnifyingGlassIcon className="h-5 w-5" />
                Find Replacement Part
            </button>
        </div>
      </div>
      
       <div className={`flex items-center text-sm font-semibold rounded-full px-4 py-1.5 mb-6 inline-flex ${riskColorMap[solution.risk]}`}>
          <ShieldCheckIcon className={`h-5 w-5 mr-2 ${riskIconColorMap[solution.risk]}`} />
          Risk Level: {solution.risk}
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center text-sm text-gray-700 bg-gray-100 rounded-full px-4 py-1.5">
            <ChartBarIcon className="h-5 w-5 text-gray-500 mr-2" />
            <strong className="font-semibold">Difficulty:</strong><span className="ml-1.5">{solution.difficulty}</span>
          </div>
          <div className="flex items-center text-sm text-gray-700 bg-gray-100 rounded-full px-4 py-1.5">
            <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
            <strong className="font-semibold">Time:</strong><span className="ml-1.5">{solution.estimatedTime}</span>
          </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center mb-3">
          <LightbulbIcon className="h-7 w-7 text-yellow-500 mr-3" />
          <h3 className="text-2xl font-semibold text-gray-700">Diagnosis</h3>
        </div>
        <p className="text-gray-600 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
          {solution.diagnosis}
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
                <ToolIcon className="h-7 w-7 text-green-500 mr-3" />
                <h3 className="text-2xl font-semibold text-gray-700">Tools Needed</h3>
            </div>
            {solution.tools && solution.tools.length > 0 && <CopyButton textToCopy={solution.tools.join('\n')} />}
        </div>
        {solution.tools && solution.tools.length > 0 ? (
          <ul className="space-y-2">
            {solution.tools.map((tool, index) => (
              <li key={index} className="flex items-start">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-600">{tool}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No special tools required for this fix!</p>
        )}
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-gray-700 mb-4">Step-by-Step Instructions</h3>
        <ol className="list-none space-y-4">
          {solution.instructions.map((step, index) => {
            const isSafetyWarning = step.toLowerCase().startsWith('safety first:');
            const isCompleted = index < currentStepIndex;
            const isActive = index === currentStepIndex;

            return (
              <li key={index} className={`flex items-start group p-4 rounded-lg transition-all duration-300 ${isActive ? 'bg-blue-50 shadow' : ''} ${isCompleted ? 'opacity-60' : ''}`}>
                 <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center font-bold mr-4 mt-1">
                    {isSafetyWarning ? (
                        <WarningIcon className="h-7 w-7 text-red-500" />
                    ) : isCompleted ? (
                        <CheckCircleIcon className="h-8 w-8 text-green-500" />
                    ) : (
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                            {index + 1}
                        </div>
                    )}
                </div>
                <div className="flex-1">
                    <p className={` ${isSafetyWarning ? 'text-red-700 font-semibold' : 'text-gray-600'} ${isCompleted ? 'line-through' : ''}`}>
                      {step}
                    </p>
                    {isActive && !isSafetyWarning && (
                        <button 
                            onClick={() => onCheckWork(index)}
                            className="mt-3 flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <CameraIcon className="h-4 w-4" />
                            Check My Work
                        </button>
                    )}
                </div>
                 <CopyButton textToCopy={step} className="opacity-0 group-hover:opacity-100 ml-4 mt-1" />
              </li>
            );
          })}
        </ol>
      </div>

      {solution.potentialPitfalls && solution.potentialPitfalls.length > 0 && (
         <div className="mt-8 bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-lg">
            <div className="flex items-center mb-3">
              <WarningIcon className="h-7 w-7 text-orange-500 mr-3" />
              <h3 className="text-2xl font-semibold text-gray-700">Potential Pitfalls</h3>
            </div>
            <ul className="space-y-2 pl-2">
              {solution.potentialPitfalls.map((pitfall, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-orange-700 mr-2 font-bold">&bull;</span>
                  <span className="text-orange-800">{pitfall}</span>
                </li>
              ))}
            </ul>
        </div>
      )}

      {chat && (
        <div className="mt-10 pt-6 border-t border-gray-200">
            <h3 className="text-2xl font-semibold text-gray-700 mb-4">Ask a Follow-up</h3>
            <ChatComponent chat={chat} />
        </div>
      )}

    </div>
  );
};

export default SolutionDisplay;