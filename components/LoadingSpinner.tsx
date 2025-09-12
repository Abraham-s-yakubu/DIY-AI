import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "Analyzing your problem...",
  "Consulting with digital experts...",
  "Checking the schematics...",
  "Formulating a step-by-step plan...",
];

const GoogleSpinner: React.FC = () => (
    <svg className="animate-spin h-12 w-12" viewBox="0 0 50 50">
        <circle className="stroke-current text-gray-200" cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
        <circle className="stroke-current text-blue-600" style={{strokeDasharray: '62.83185307179586', strokeDashoffset: '47.1238898038469'}} cx="25" cy="25" r="20" fill="none" strokeWidth="4"></circle>
    </svg>
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
      <GoogleSpinner />
      <p className="text-lg font-medium text-gray-700 mt-4">
        {loadingMessages[messageIndex]}
      </p>
      <p className="text-sm text-gray-500 mt-1">Our AI expert is on the case!</p>
    </div>
  );
};

export default LoadingSpinner;