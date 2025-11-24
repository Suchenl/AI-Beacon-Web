import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Paper, Pillar } from './types';
import Markdown from 'react-markdown';
import { getAIProvider, AIModel } from './aiProvider';

interface ViewTutorProps {
    messages: ChatMessage[];
    onMessagesChange: (messages: ChatMessage[]) => void;
    pillars: Pillar[];
    selectedModel: AIModel;
    onPaperDropped?: (paper: Paper) => void;
}

export const ViewTutor: React.FC<ViewTutorProps> = ({ messages, onMessagesChange, pillars, selectedModel, onPaperDropped }) => {
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const chatSession = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Reset chat session when pillars or model change to update system instruction or model
    useEffect(() => {
        if (chatSession.current) {
            chatSession.current = null; // Reset to use new system instruction or model on next message
        }
    }, [pillars, selectedModel]);

    // Handle paper drop - insert paper reference into input instead of sending directly
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const paperData = e.dataTransfer.getData('application/json');
        if (!paperData) {
            console.log('No paper data found in drop event');
            return;
        }

        try {
            const paper: Paper = JSON.parse(paperData);
            console.log('Dropped paper:', paper.title);

            // Insert paper reference into input (like Cursor does)
            const paperRef = `[${paper.title}](${paper.link})`;
            const currentText = input.trim();

            if (currentText) {
                // If there's existing text, add the reference with a space
                setInput(`${currentText} ${paperRef}`);
            } else {
                // If input is empty, just add the reference
                setInput(paperRef);
            }

            // Call onPaperDropped callback if provided
            if (onPaperDropped) {
                onPaperDropped(paper);
            }

            // Focus the input after inserting
            setTimeout(() => {
                inputRef.current?.focus();
                // Move cursor to end of input
                if (inputRef.current) {
                    const length = inputRef.current.value.length;
                    inputRef.current.setSelectionRange(length, length);
                }
            }, 0);
        } catch (error) {
            console.error('Error handling paper drop:', error);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Check if we have the right data type
        if (e.dataTransfer.types.includes('application/json')) {
            setIsDragOver(true);
            e.dataTransfer.dropEffect = 'copy';
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        // Only hide if we're leaving the container, not just moving to a child
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;

        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setIsDragOver(false);
        }
    };

    // Generate system instruction from pillars
    const generateSystemInstruction = (): string => {
        if (pillars.length === 0) {
            return `You are the "AI Beacon" Tutor, a world-class expert researcher in Artificial Intelligence.

Goal: Explain complex papers and concepts simply. Use analogies. If asked about code, provide Python snippets.
Tone: Academic yet accessible, encouraging, and precise.`;
        }

        const pillarsList = pillars.map((pillar, index) => {
            const topicsList = pillar.topics.length > 0
                ? pillar.topics.map(topic => `  - ${topic.title}${topic.description ? `: ${topic.description}` : ''}`).join('\n')
                : '  (No topics yet)';

            return `${index + 1}. ${pillar.title}${pillar.subtitle ? ` (${pillar.subtitle})` : ''}${pillar.description ? `: ${pillar.description}` : ''}\n${topicsList}`;
        }).join('\n\n');

        return `You are the "AI Beacon" Tutor, a world-class expert researcher in Artificial Intelligence.

Your knowledge spans the following pillars and topics in the user's knowledge base:

${pillarsList}

Goal: Explain complex papers and concepts simply. Use analogies. If asked about code, provide Python snippets.
Tone: Academic yet accessible, encouraging, and precise.`;
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
        onMessagesChange([...messages, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            const provider = getAIProvider(selectedModel);
            const systemInstruction = generateSystemInstruction();

            if (!chatSession.current) {
                const chat = provider.createChat?.({
                    model: selectedModel,
                    config: {
                        systemInstruction: systemInstruction,
                    }
                });
                if (chat) {
                    chatSession.current = chat;
                }
            } else {
                // If chat session exists but pillars or model changed, we might want to update it
                // For now, we'll keep the existing session, but could recreate if needed
            }

            if (chatSession.current) {
                const result = await chatSession.current.sendMessage({ message: userMsg.text });
                const responseText = result.text;

                onMessagesChange([...messages, userMsg, {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    text: responseText || "I couldn't generate a response."
                }]);
            } else {
                // Fallback: use generateContent for models that don't support chat
                const response = await provider.generateContent({
                    prompt: userMsg.text,
                    model: selectedModel,
                    systemInstruction: generateSystemInstruction()
                });
                onMessagesChange([...messages, userMsg, {
                    id: (Date.now() + 1).toString(),
                    role: 'model',
                    text: response.text || "I couldn't generate a response."
                }]);
            }

        } catch (error) {
            console.error(error);
            onMessagesChange([...messages, userMsg, {
                id: (Date.now() + 1).toString(),
                role: 'model',
                text: "Sorry, I encountered an error reaching the model.",
                isError: true
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div
            className="h-full flex flex-col bg-slate-900 relative overflow-hidden"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            {/* Sidebar Header - removed duplicate title */}

            {/* Chat Messages Area - flex-1 to take remaining space */}
            <div
                className="flex-1 overflow-y-auto scrollbar-hide relative min-h-0"
                style={{ paddingBottom: '80px' }} // Space for input area
            >
                {isDragOver && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 bg-blue-900/30 border-2 border-blue-500 border-dashed">
                        <div className="bg-blue-600/20 backdrop-blur-sm rounded-xl px-8 py-6 border-2 border-blue-500 border-dashed">
                            <p className="text-blue-300 font-bold text-lg">Drop paper here to add reference</p>
                        </div>
                    </div>
                )}
                <div className="p-4">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex mb-6 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-6 py-4 ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-slate-700 text-slate-200 rounded-bl-none'
                                }`}>
                                {msg.role === 'model' ? (
                                    <div className="prose prose-invert prose-sm max-w-none">
                                        <Markdown>{msg.text}</Markdown>
                                    </div>
                                ) : (
                                    <p>{msg.text}</p>
                                )}
                                {msg.isError && <p className="text-red-400 text-xs mt-2">Error sending message</p>}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start mb-6">
                            <div className="bg-slate-700 text-slate-400 px-6 py-4 rounded-2xl rounded-bl-none flex gap-2 items-center">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area - fixed at bottom using flex-shrink-0 */}
            <div className="flex-shrink-0 border-t border-slate-800 p-4 bg-slate-900 z-20">
                <div className="flex gap-2 mb-2">
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to clear all chat history?')) {
                                onMessagesChange([{ id: 'intro', role: 'model', text: 'Welcome to AI Beacon. I can explain any paper or concept across the 5 pillars of AI: Perception, Reasoning, Agents, Alignment, and Efficiency. What would you like to learn?' }]);
                                chatSession.current = null; // Reset chat session
                            }
                        }}
                        className="text-xs text-slate-400 hover:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1"
                        title="Clear chat history"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Clear
                    </button>
                </div>
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="Ask about Q* learning, PPO, or Transformers..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isTyping || !input.trim()}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-3 rounded-xl font-medium transition-colors text-sm"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};