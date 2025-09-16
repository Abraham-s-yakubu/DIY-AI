import React, { useState, useCallback } from 'react';
import type { Solution, PartIdentification, VerificationResult } from './types';
import type { Chat } from '@google/genai';
import { getFixItSolution, startChatSession, identifyPart } from './services/geminiService';

import InputForm from './components/InputForm';
import SolutionDisplay from './components/SolutionDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorAlert from './components/ErrorAlert';
import PartFinder from './components/ListeningModal';
import LocaleSelector from './components/LocaleSelector';
import type { Locale } from './components/LocaleSelector';
import { HammerIcon, CloseIcon, WarningIcon, GithubIcon } from './components/icons';

type AppState = 'idle' | 'loading' | 'error' | 'solution';
type ModalState = 'none' | 'partFinder';

// A simple modal component defined within App.tsx to avoid creating new files.
const Modal: React.FC<{ isOpen: boolean, onClose: () => void, children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-gray-800 bg-opacity-75 z-50 flex items-center justify-center p-4"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
                onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
            >
                <div className="flex justify-end p-2">
                     <button 
                        onClick={onClose} 
                        className="p-2 rounded-full text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
                        aria-label="Close modal"
                     >
                        <CloseIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="px-8 pb-8 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

const HighRiskWarning: React.FC<{ solution: Solution }> = ({ solution }) => {
    return (
        <div className="bg-red-50 border-l-4 border-red-500 p-8 rounded-r-lg text-center animate-fade-in">
            <WarningIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-red-800">Professional Help Required</h2>
            <p className="mt-4 text-lg text-red-700">
                This repair is considered **High Risk**. For your safety, please do not attempt this yourself.
            </p>
            <div className="mt-6 bg-white p-4 rounded-md shadow-sm">
                <p className="text-md text-gray-800 font-semibold">AI Safety Assessment:</p>
                <p className="mt-2 text-gray-600">{solution.safetyWarning}</p>
            </div>
            <p className="mt-6 text-sm text-gray-500">
                Contact a licensed professional for assistance.
            </p>
        </div>
    );
};


const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('idle');
    const [modalState, setModalState] = useState<ModalState>('none');
    
    const [solution, setSolution] = useState<Solution | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [locale, setLocale] = useState<Locale>('Generic/Global');

    // Part Finder state
    const [isPartFinderLoading, setIsPartFinderLoading] = useState(false);
    const [partFinderError, setPartFinderError] = useState<string | null>(null);
    const [partFinderResult, setPartFinderResult] = useState<PartIdentification | null>(null);
    
    // Step progress state
    const [currentStepProgress, setCurrentStepProgress] = useState(0);

    const handleGetSolution = useCallback(async (fileBase64: string, mimeType: string, problemDescription: string) => {
        setAppState('loading');
        setError(null);
        setSolution(null);
        setChat(null);
        setCurrentStepProgress(0); // Reset progress
        
        try {
            const result = await getFixItSolution(fileBase64, mimeType, problemDescription, locale);
            setSolution(result);
            setAppState('solution');
            
            // Only start a chat session for low/medium risk repairs that have instructions
            if (result.risk !== 'High' && result.diagnosis && result.instructions) {
                const context = `Problem: ${problemDescription}\nSolution Provided:\n- Diagnosis: ${result.diagnosis}\n- Instructions: ${result.instructions.join('\n')}`;
                const chatSession = startChatSession(context);
                setChat(chatSession);
            }

        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
            setAppState('error');
        }
    }, [locale]);
    
    const handleIdentifyPart = useCallback(async (imageBase64: string, mimeType: string) => {
        setIsPartFinderLoading(true);
        setPartFinderError(null);
        setPartFinderResult(null);

        try {
            const result = await identifyPart(imageBase64, mimeType);
            setPartFinderResult(result);
        } catch (e: any) {
            setPartFinderError(e.message || 'Failed to identify the part.');
        } finally {
            setIsPartFinderLoading(false);
        }
    }, []);

    const resetPartFinder = useCallback(() => {
        setPartFinderResult(null);
        setPartFinderError(null);
    }, []);

    const handleOpenPartFinder = () => {
        resetPartFinder();
        setModalState('partFinder');
    };

    const handleCheckWork = (stepIndex: number) => {
        // Since there's no UI for uploading 'before' and 'after' images for verification,
        // we'll simply advance the step progress to allow the user to track where they are.
        if (solution && solution.instructions && stepIndex < solution.instructions.length) {
           setCurrentStepProgress(stepIndex + 1);
        }
    };
    
    const handleReset = () => {
        setAppState('idle');
        setSolution(null);
        setError(null);
        setChat(null);
        setCurrentStepProgress(0);
    };

    const renderContent = () => {
        switch (appState) {
            case 'loading':
                return <LoadingSpinner />;
            case 'error':
                return (
                    <div className="text-center">
                        <ErrorAlert message={error!} />
                        <button onClick={handleReset} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            Try Again
                        </button>
                    </div>
                );
            case 'solution':
                if (solution) {
                    if (solution.risk === 'High') {
                        return <HighRiskWarning solution={solution} />;
                    }
                    return <SolutionDisplay 
                                solution={solution} 
                                chat={chat} 
                                onFindPartClick={handleOpenPartFinder}
                                currentStepIndex={currentStepProgress}
                                onCheckWork={handleCheckWork}
                            />;
                }
                return null; // Should not happen
            case 'idle':
            default:
                return <InputForm onSubmit={handleGetSolution} />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen font-sans">
            <header className="bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center">
                            <HammerIcon className="h-8 w-8 text-blue-600" />
                            <h1 className="ml-3 text-2xl font-bold text-gray-800 tracking-tight">DIY-AI Fix-It</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            {(appState === 'solution' || appState === 'error') && (
                                <button onClick={handleReset} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                                    Start New Fix
                                </button>
                            )}
                             <LocaleSelector locale={locale} onLocaleChange={setLocale} />
                             <a 
                                href="https://github.com/google-gemini/diy-ai-fix-it-react" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                                aria-label="View source on GitHub"
                             >
                                <GithubIcon className="h-6 w-6" />
                            </a>
                        </div>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="max-w-4xl mx-auto">
                    {renderContent()}
                </div>
            </main>
            <footer className="text-center py-6 text-sm text-gray-500">
                <p>&copy; {new Date().getFullYear()} DIY-AI Fix-It. Powered by Gemini.</p>
            </footer>
            
            <Modal isOpen={modalState === 'partFinder'} onClose={() => setModalState('none')}>
                <PartFinder 
                    onSubmit={handleIdentifyPart}
                    isLoading={isPartFinderLoading}
                    error={partFinderError}
                    result={partFinderResult}
                    onResetForm={resetPartFinder}
                />
            </Modal>
        </div>
    );
};

export default App;