import React, { useState, useRef, useEffect } from 'react';
import type { Chat } from '@google/genai';
import type { ChatMessage } from '../types';
import { PaperAirplaneIcon } from './icons';

interface ChatProps {
    chat: Chat;
}

const formatResponseText = (text: string): string => {
    // Replace markdown list prefixes (* or -) at the beginning of a line with a bullet.
    let formattedText = text.replace(/^(\s*[-*])\s+/gm, '• ');
    // Remove any remaining asterisks (e.g., from **bold** text).
    formattedText = formattedText.replace(/\*/g, '');
    return formattedText;
};

const LoadingBubble: React.FC = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
    </div>
);

const ChatComponent: React.FC<ChatProps> = ({ chat }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = input.trim();
        if (!trimmedInput || isSending) return;

        setIsSending(true);
        const userMessage: ChatMessage = { sender: 'user', text: trimmedInput };
        setMessages(prev => [...prev, userMessage, { sender: 'ai', text: '', isLoading: true }]);
        setInput('');

        try {
            const stream = await chat.sendMessageStream({ message: trimmedInput });
            
            let accumulatedText = '';
            for await (const chunk of stream) {
                accumulatedText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'ai') {
                        lastMessage.text = formatResponseText(accumulatedText);
                        lastMessage.isLoading = false;
                    }
                    return newMessages;
                });
            }
        } catch (error) {
            console.error("Error sending chat message:", error);
             setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai') {
                    lastMessage.text = "Sorry, I couldn't process that. Please try again.";
                    lastMessage.isLoading = false;
                }
                return newMessages;
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="bg-gray-50 rounded-lg p-4 flex flex-col h-full max-h-[50vh]">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg rounded-xl px-4 py-2.5 ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                            {msg.isLoading ? <LoadingBubble /> : <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                    </div>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="mt-4 flex items-center gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={isSending}
                    className="flex-1 block w-full rounded-md border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 placeholder-gray-400"
                    aria-label="Chat input"
                />
                <button
                    type="submit"
                    disabled={!input.trim() || isSending}
                    className="p-3 rounded-full text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                >
                    <PaperAirplaneIcon className="h-5 w-5" />
                </button>
            </form>
        </div>
    );
};

export default ChatComponent;