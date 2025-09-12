
import React, { useState, useEffect } from 'react';
import { HammerIcon, WrenchIcon, SawIcon, PaintBrushIcon } from './icons';

const loadingMessages = [
  "Tightening the bolts on your request...",
  "Sawing through the complexity...",
  "Consulting with digital experts...",
  "Hammering out a step-by-step plan...",
  "Adding a fresh coat of analysis...",
];

const ToolSpinner: React.FC = () => (
    <div className="grid grid-cols-2 gap-8 text-blue-600">
        <div className="flex justify-center items-center h-16 w-16">
            {/* FIX: Replaced inline style with Tailwind CSS 'origin-bottom-right' class to fix prop type error. */}
            <HammerIcon className="h-10 w-10 animate-swing origin-bottom-right" />
        </div>
        <div className="flex justify-center items-center h-16 w-16">
            <WrenchIcon className="h-10 w-10 animate-turn" />
        </div>
        <div className="flex justify-center items-center h-16 w-16">
            <SawIcon className="h-10 w-10 animate-saw" />
        </div>
        <div className="flex justify-center items-center h-16 w-16">
            {/* FIX: Replaced inline style with Tailwind CSS 'origin-bottom' class to fix prop type error. */}
            <PaintBrushIcon className="h-10 w-10 animate-brush origin-bottom" />
        </div>
    </div>
);


const LoadingSpinner: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 2500);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <ToolSpinner />
      <p className="text-lg font-medium text-gray-700 mt-8">
        {loadingMessages[messageIndex]}
      </p>
      <p className="text-sm text-gray-500 mt-1">Our AI expert is on the case!</p>
    </div>
  );
};

export default LoadingSpinner;
