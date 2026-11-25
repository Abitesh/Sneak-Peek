import { MeetingModelSelector } from './ui/MeetingModelSelector';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStreamBuffer } from '../hooks/useStreamBuffer';
import { X, Copy, Check, Globe, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { genMessageId } from '../utils/messageId';
import sneakPeekIcon from './icon.png';
import { useResolvedTheme } from '../hooks/useResolvedTheme';

// ============================================
// Types
// ============================================

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    isStreaming?: boolean;
}

interface GlobalChatOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string;
}

// ============================================
// Typing Indicator Component
// ============================================

const TypingIndicator: React.FC = () => (
    <div className="flex items-center gap-1 py-4">
        <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-text-tertiary"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                    }}
                />
            ))}
        </div>
    </div>
);

// ============================================
// Message Components
// ============================================

const UserMessage: React.FC<{ content: string }> = ({ content }) => (
    <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex justify-end mb-6"
    >
        <div className="bg-[#2C2C2E] text-white px-5 py-3 rounded-2xl rounded-tr-md max-w-[70%] text-[15px] leading-relaxed">
            {content}
        </div>
    </motion.div>
);

const AssistantMessage: React.FC<{ content: string; isStreaming?: boolean }> = ({ content, isStreaming }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-start mb-6"
        >
            <div className="text-text-primary text-[15px] leading-relaxed max-w-[85%]">
                {content}
            </div>
            {!isStreaming && content && (
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 mt-3 text-[13px] text-text-tertiary hover:text-text-secondary transition-colors"
                >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy message'}
                </button>
            )}
        </motion.div>
    );
};

// ============================================
// Main Component
// ============================================

type ChatState = 'idle' | 'waiting_for_llm' | 'streaming_response' | 'error';

// Hard client-side ceiling on the ragQueryGlobal IPC round-trip. The main
// process has its own internal timeouts (worker deadman switch, stream
// stall guard), but every one of those protects a DIFFERENT stage of the
// pipeline — if the hang happens somewhere NONE of them cover (e.g. the
// main thread itself blocked inside a synchronous native call before any
// of those timers can even be scheduled), the `await` on this invoke() has
// no ceiling of its own and can wait forever with the UI showing nothing.
// This is the backstop: no matter what breaks on the other side of the IPC
// boundary, the user gets an answer (even if it's "something went wrong")
// within a bounded time instead of a silently frozen chat bubble.
const RAG_QUERY_CLIENT_TIMEOUT_MS = 20000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(`${label} timed out after ${ms}ms — the main process never responded`));
        }, ms);
        promise.then(
            (v) => { clearTimeout(timer); resolve(v); },
            (e) => { clearTimeout(timer); reject(e); },
        );
    });
}

const GlobalChatOverlay: React.FC<GlobalChatOverlayProps> = ({
    isOpen,
    onClose,
    initialQuery = ''
}) => {
    const [answeringBinding,setAnsweringBinding]=useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatState, setChatState] = useState<ChatState>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const streamBuffer = useStreamBuffer();
    // Match the meeting chat overlay / modes manager --mm-bg exactly so
    // the expanded card looks like the same dark grey surface.
    const isLightTheme = useResolvedTheme() === 'light';
    const chatWindowBg = isLightTheme ? '#f9f9f9' : '#111111';

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatWindowRef = useRef<HTMLDivElement>(null);
    // A finalizer may only release the stream and busy flag it owns.
    const submitInFlightRef = useRef<symbol | null>(null);
    const handleClose = useCallback(() => {
        submitInFlightRef.current = null;
        onClose();
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) {
            submitInFlightRef.current = null;
            void window.electronAPI?.ragCancelQuery?.({ global: true, clearContext: true });
        }
    }, [isOpen]);

    // Submit initial query when overlay opens
    useEffect(() => {
        if (isOpen && initialQuery && messages.length === 0) {
            const timer = setTimeout(() => {
                submitQuestion(initialQuery);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialQuery]);

    // Listen for new queries from parent
    useEffect(() => {
        if (isOpen && initialQuery && messages.length > 0) {
            // This is a follow-up query
            submitQuestion(initialQuery);
        }
    }, [initialQuery]);

    // ESC key handler
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose]);

    // Click outside handler
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    }, [handleClose]);

    const handleInputKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && query.trim()) {
            e.preventDefault();
            submitQuestion(query);
            setQuery('');
        }
    };

    // Submit question using global RAG
    const submitQuestion = useCallback(async (question: string) => {
        if (!question.trim() || submitInFlightRef.current) return;
        const request = Symbol();
        submitInFlightRef.current = request;
        const isCurrent = () => submitInFlightRef.current === request;

        const userMessage: Message = {
            id: genMessageId(),
            role: 'user',
            content: question
        };
        setMessages(prev => [...prev, userMessage]);
        setChatState('waiting_for_llm');
        setErrorMessage(null);

        // Scroll to bottom when user sends message
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 50);

        const assistantMessageId = genMessageId();

        // Track active listener cleanups so the finally block can always
        // remove them — even if the IPC done/error events never arrive.
        // Without this, a hung stream leaves `chatState` stuck at
        // 'waiting_for_llm' / 'streaming_response' and the guard at the
        // top of submitQuestion silently drops every subsequent message
        // (no user-message push, no response).
        let activeCleanups: Array<() => void> = [];

        try {
            // Create assistant message placeholder
            setMessages(prev => [...prev, {
                id: assistantMessageId,
                role: 'assistant',
                content: '',
                isStreaming: true
            }]);

            // Set up RAG streaming listeners (RAF-batched)
            streamBuffer.reset();
            // F-122: the rag:stream-* channels are SHARED by three scopes and
            // main tags every payload ({meetingId} | {live:true} | {global:true}),
            // but no consumer read the tag — so a meeting-scoped or live-scoped
            // stream could paint into this overlay's bubble. GlobalChatOverlay and
            // MeetingDetails are siblings in the same Launcher renderer, and
            // abortPriorRAGQueriesOfClass only supersedes WITHIN a class, so two
            // different-class queries can genuinely be in flight together.
            const isGlobal = (d: any) => d?.global === true;
            const tokenCleanup = window.electronAPI?.onRAGStreamChunk((data: { chunk: string }) => {
                if (!isCurrent() || !isGlobal(data)) return;
                setChatState('streaming_response');
                streamBuffer.appendToken(data.chunk, (content) => {
                    if (!isCurrent()) return;
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, content }
                            : msg
                    ));
                });
            });

            const doneCleanup = window.electronAPI?.onRAGStreamComplete((data?: any) => {
                if (!isCurrent() || !isGlobal(data)) return;
                if(data?.answeringModel)setAnsweringBinding(`${data.answeringProvider??''} · ${data.answeringModel}`);
                // The stream can legitimately complete with zero chunks (e.g. a
                // short non-question like "hi" fed through the strict RAG-grounding
                // prompt can make the model return an empty/degenerate completion).
                // Without this fallback, the bubble renders as nothing — no text,
                // no error — which reads as "the app didn't respond at all".
                const finalContent = data?.answer?.trim() || streamBuffer.getBufferedContent().trim() || 'No answer was returned. Check your selected model and try again.';
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: finalContent, isStreaming: false }
                        : msg
                ));
                setChatState('idle');
                streamBuffer.reset();
                tokenCleanup?.();
                doneCleanup?.();
                errorCleanup?.();
            });

            const errorCleanup = window.electronAPI?.onRAGStreamError((data: { error: string }) => {
                if (!isCurrent() || !isGlobal(data)) return;
                console.error('[GlobalChat] RAG stream error:', data.error);
                setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
                setErrorMessage(data.error || 'Could not get a response. Check your selected model.');
                setChatState('error');
                streamBuffer.reset();
                tokenCleanup?.();
                doneCleanup?.();
                errorCleanup?.();
            });

            if (tokenCleanup) activeCleanups.push(tokenCleanup);
            if (doneCleanup) activeCleanups.push(doneCleanup);
            if (errorCleanup) activeCleanups.push(errorCleanup);

            // Use global RAG query. Wrapped in a hard client-side ceiling — see
            // RAG_QUERY_CLIENT_TIMEOUT_MS above for why this exists: nothing
            // upstream of this call can guarantee the invoke() ever resolves.
            let result: { fallback?: boolean; success?: boolean; error?: string; answer?: string } | undefined;
            try {
                const call = window.electronAPI?.ragQueryGlobal(question);
                result = call
                    ? await withTimeout(call, RAG_QUERY_CLIENT_TIMEOUT_MS, 'ragQueryGlobal')
                    : undefined;
            } catch (timeoutErr) {
                if (!isCurrent()) return;
                void window.electronAPI?.ragCancelQuery?.({ global: true });
                console.error('[GlobalChat] ragQueryGlobal client-side timeout:', timeoutErr);
                // Tear down the RAG listeners we just registered — the main
                // process may still respond well after this point (its own
                // internal timeouts run on a longer clock), and a late
                // rag:stream-chunk/-complete/-error must not land on a message
                // this function has already abandoned.
                tokenCleanup?.();
                doneCleanup?.();
                errorCleanup?.();
                activeCleanups = [];
                setMessages(prev => prev.map(msg =>
                    msg.id === assistantMessageId
                        ? { ...msg, content: "This is taking longer than expected. Please try again.", isStreaming: false }
                        : msg
                ));
                setChatState('error');
                setErrorMessage("The search took too long to respond. Please try again.");
                return;
            }

            // Invoke and stream events can settle in either order. The same
            // completed canonical answer is a request-owned terminal fallback.
            if (isCurrent() && result?.success && result.answer?.trim()) {
                setMessages(prev => prev.map(msg => msg.id === assistantMessageId
                    ? {...msg, content: result.answer!, isStreaming: false} : msg));
                setChatState('idle');
            }
            if (isCurrent() && (!result?.success || result.fallback)) {
                setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
                setErrorMessage(result?.error || 'Meeting search is unavailable. Check your selected model and try again.');
                setChatState('error');
            }

        } catch (error) {
            if (!isCurrent()) return;
            console.error('[GlobalChat] Error:', error);
            setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
            setErrorMessage("Something went wrong. Please try again.");
            setChatState('error');
        } finally {
            // Always remove listeners and reset chatState — even if the
            // IPC done/error callbacks never fired. Without this, a single
            // hung stream leaves chatState stuck and silently drops every
            // subsequent submitQuestion (no user-message push, no response).
            activeCleanups.forEach(fn => fn());
            activeCleanups = [];
            if (isCurrent()) {
                setChatState(prev => (prev === 'error' ? prev : 'idle'));
                streamBuffer.reset();
                submitInFlightRef.current = null;
            }
        }
    }, []);

    return (
        <AnimatePresence
            onExitComplete={() => {
                if (submitInFlightRef.current) return;
                setChatState('idle');
                setMessages([]);
                setErrorMessage(null);
            }}
        >
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="absolute inset-0 z-40 flex flex-col justify-end"
                    onClick={handleBackdropClick}
                >
                    {/* Backdrop with blur */}
                    <motion.div
                        initial={{ backdropFilter: 'blur(0px)' }}
                        animate={{ backdropFilter: 'blur(8px)' }}
                        exit={{ backdropFilter: 'blur(0px)' }}
                        transition={{ duration: 0.16 }}
                        className="absolute inset-0 bg-black/40"
                    />

                    {/* Chat Window */}
                    <motion.div
                        ref={chatWindowRef}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "85vh", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{
                            height: { type: "spring", stiffness: 300, damping: 30, mass: 0.8 },
                            opacity: { duration: 0.2 }
                        }}
                        className="relative mx-auto w-full max-w-[680px] mb-0 rounded-t-[24px] border-t border-x border-border-subtle shadow-2xl overflow-hidden flex flex-col"
                        style={{ backgroundColor: chatWindowBg }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
                            <div className="flex items-center gap-2 text-text-tertiary">
                                <img src={sneakPeekIcon} className="w-3.5 h-3.5 force-black-icon opacity-50" alt="logo" />
                                <span className="text-[13px] font-medium">Search all meetings</span>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 transition-colors group"
                            >
                                <X size={16} className="text-text-tertiary group-hover:text-red-500 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-all duration-300" />
                            </button>
                        </div>

                        {/* Messages area - scrollable */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 pb-32 custom-scrollbar">
                            {messages.map((msg) => (
                                msg.role === 'user'
                                    ? <UserMessage key={msg.id} content={msg.content} />
                                    : <AssistantMessage key={msg.id} content={msg.content} isStreaming={msg.isStreaming} />
                            ))}

                            {chatState === 'waiting_for_llm' && <TypingIndicator />}

                            {errorMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-[#FF6B6B] text-[13px] py-2"
                                >
                                    {errorMessage}
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Floating Footer (Ask Bar) */}
                        <div className="absolute bottom-0 left-0 right-0 p-6 flex justify-center z-50 pointer-events-none">
                            <div className="w-full max-w-[620px] flex items-center gap-2 group pointer-events-auto">
                                {/* Dark Glass Effect Input */}
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleInputKeyDown}
                                    placeholder="Search saved meetings..."
                                    className="min-w-0 flex-1 pl-5 pr-3 py-3 bg-bg-elevated shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-border-muted rounded-full text-sm text-text-primary placeholder-text-tertiary/70 focus:outline-none transition-all"
                                />
                                <MeetingModelSelector />{answeringBinding&&<span className="max-w-40 truncate text-[10px] text-text-secondary" title={answeringBinding}>Last answer: {answeringBinding}</span>}
                                <button
                                    onClick={() => {
                                        if (query.trim()) {
                                            submitQuestion(query);
                                            setQuery('');
                                        }
                                    }}
                                    className={`p-2 shrink-0 rounded-full transition-all duration-200 border border-white/5 ${query.trim() ? 'bg-text-primary text-bg-primary hover:scale-105' : 'bg-bg-item-active text-text-primary hover:bg-bg-item-hover'
                                        }`}
                                >
                                    <ArrowUp size={16} className="transform rotate-45" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalChatOverlay;
