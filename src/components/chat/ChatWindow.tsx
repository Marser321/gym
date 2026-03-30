"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Send, User, Loader2, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
}

interface ChatWindowProps {
    userId: string;
    partnerId: string;
    partnerName: string;
}

export function ChatWindow({ userId, partnerId, partnerName }: ChatWindowProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const scrollRef = useRef<HTMLDivElement>(null);
    const preserveScrollRef = useRef(false);
    const prevScrollHeightRef = useRef(0);
    const lastMessageIdRef = useRef<string | null>(null);

    const supabase = createClient();
    const PAGE_SIZE = 50;

    const loadMessages = useCallback(async (offset = 0) => {
        if (offset === 0) setIsLoading(true);
        else setLoadingMore(true);

        try {
            const { data, error } = await supabase
                .from("messages")
                .select("*")
                .or(`and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`)
                .order("created_at", { ascending: false })
                .range(offset, offset + PAGE_SIZE - 1);

            if (error) throw error;

            const fetchedMessages = data || [];
            const reversedMessages = [...fetchedMessages].reverse();

            if (offset === 0) {
                setMessages(reversedMessages);
                // Reset scroll tracking
                lastMessageIdRef.current = null;
            } else {
                if (reversedMessages.length > 0) {
                    preserveScrollRef.current = true;
                    prevScrollHeightRef.current = scrollRef.current?.scrollHeight || 0;
                    setMessages((prev) => [...reversedMessages, ...prev]);
                }
            }

            setHasMore(fetchedMessages.length >= PAGE_SIZE);
        } catch (err) {
            console.error("Error fetching messages:", err);
        } finally {
            setIsLoading(false);
            setLoadingMore(false);
        }
    }, [userId, partnerId, supabase]);

    useEffect(() => {
        loadMessages(0);

        // Subscribe to real-time messages
        const channel = supabase
            .channel(`chat:${userId}:${partnerId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "messages",
                },
                (payload) => {
                    const msg = payload.new as Message;
                    if (
                        (msg.sender_id === userId && msg.receiver_id === partnerId) ||
                        (msg.sender_id === partnerId && msg.receiver_id === userId)
                    ) {
                        setMessages((prev) => [...prev, msg]);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, partnerId, loadMessages, supabase]);

    useEffect(() => {
        if (!scrollRef.current) return;

        if (preserveScrollRef.current) {
            const newScrollHeight = scrollRef.current.scrollHeight;
            const diff = newScrollHeight - prevScrollHeightRef.current;
            scrollRef.current.scrollTop = diff;
            preserveScrollRef.current = false;
        } else {
            // Auto-scroll to bottom only if new messages added at the end (or initial load)
            const lastMsg = messages[messages.length - 1];
            const lastMsgId = lastMsg?.id;

            if (messages.length > 0 && lastMsgId !== lastMessageIdRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
            lastMessageIdRef.current = lastMsgId || null;
        }
    }, [messages]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop } = e.currentTarget;
        if (scrollTop === 0 && hasMore && !loadingMore && !isLoading) {
            loadMessages(messages.length);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending) return;

        setIsSending(true);
        try {
            const { error } = await supabase.from("messages").insert({
                sender_id: userId,
                receiver_id: partnerId,
                content: newMessage.trim(),
            });

            if (error) throw error;
            setNewMessage("");
        } catch (err) {
            console.error("Error sending message:", err);
            alert("No se pudo enviar el mensaje");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] border border-white/10 rounded-3xl overflow-hidden bg-black/40 backdrop-blur-xl">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-neon-cyan/20 flex items-center justify-center border border-neon-cyan/30">
                    <User className="h-5 w-5 text-neon-cyan" />
                </div>
                <div>
                    <h3 className="font-bold text-white uppercase tracking-tight italic">{partnerName}</h3>
                    <p className="text-[10px] text-neon-cyan font-black uppercase tracking-widest">En línea</p>
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
            >
                {loadingMore && (
                    <div className="flex justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin text-neon-cyan/50" />
                    </div>
                )}
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-neon-cyan" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full opacity-40 text-center px-10">
                        <User className="h-10 w-10 mb-2" />
                        <p className="text-xs font-bold uppercase text-gray-400">Comienza a chatear con tu Coach</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.sender_id === userId;
                        return (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: isMe ? 20 : -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe
                                    ? "bg-neon-cyan text-black font-medium"
                                    : "bg-white/10 text-white border border-white/5"
                                    }`}>
                                    <p>{msg.content}</p>
                                    <div className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? "text-black/60" : "text-gray-500"}`}>
                                        {format(new Date(msg.created_at), "HH:mm", { locale: es })}
                                        {isMe && <CheckCheck className="h-3 w-3" />}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-4 text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="h-10 w-10 rounded-xl bg-neon-cyan text-black flex items-center justify-center hover:shadow-[0_0_15px_rgba(0,243,255,0.5)] transition-all disabled:opacity-50"
                >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
            </form>
        </div>
    );
}
