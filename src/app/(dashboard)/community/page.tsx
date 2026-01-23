"use client";

import { CrystalCard } from "@/components/crystal/CrystalCard";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Zap, MapPin, Dumbbell } from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

interface FeedItem {
    id: string;
    user_name: string;
    avatar_url: string;
    type: "workout" | "level_up" | "check_in" | "match";
    message: string;
    timestamp: string;
}

const MOCK_FEED: FeedItem[] = [
    { id: "1", user_name: "Sofía M.", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia", type: "workout", message: "Completó 'Leg Day Extremo'", timestamp: "Hace 2 min" },
    { id: "2", user_name: "Juan P.", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Juan", type: "check_in", message: "Hizo check-in en sucursal Centro", timestamp: "Hace 5 min" },
    { id: "3", user_name: "Carlos R.", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos", type: "level_up", message: "Alcanzó el Nivel Plata 🥈", timestamp: "Hace 12 min" },
];

export default function CommunityPage() {
    const [feed, setFeed] = useState<FeedItem[]>(MOCK_FEED);

    // Simulate incoming events
    useEffect(() => {
        const interval = setInterval(() => {
            const newEvent: FeedItem = {
                id: Date.now().toString(),
                user_name: ["Ana K.", "Pedro L.", "Luisa M."][Math.floor(Math.random() * 3)],
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
                type: ["workout", "check_in", "match"][Math.floor(Math.random() * 3)] as any,
                message: "¡Está entrenando duro! 🔥",
                timestamp: "Justo ahora"
            };

            setFeed(prev => [newEvent, ...prev].slice(0, 10)); // Keep last 10
        }, 8000);

        return () => clearInterval(interval);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case "workout": return <Dumbbell className="h-4 w-4 text-neon-cyan" />;
            case "level_up": return <Trophy className="h-4 w-4 text-yellow-400" />;
            case "check_in": return <MapPin className="h-4 w-4 text-green-400" />;
            default: return <Zap className="h-4 w-4 text-purple-400" />;
        }
    };

    return (
        <div className="space-y-6 pb-24">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-white">Gym <span className="text-neon-cyan">Buzz</span> ⚡</h1>
                <p className="text-gray-400">Lo que está pasando ahora en el gym.</p>
            </div>

            <div className="space-y-4">
                <AnimatePresence initial={false}>
                    {feed.map((item) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.4 }}
                            layout
                        >
                            <CrystalCard className="flex items-center gap-4 p-4 hover:bg-white/5 border-l-4 border-l-transparent hover:border-l-neon-cyan transition-all">
                                <div className="relative h-10 w-10 rounded-full overflow-hidden border border-white/10">
                                    <Image src={item.avatar_url} alt={item.user_name} fill />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-white text-sm">{item.user_name}</span>
                                        <span className="text-[10px] text-gray-500">• {item.timestamp}</span>
                                    </div>
                                    <p className="text-xs text-gray-300 flex items-center gap-1 mt-0.5">
                                        {getIcon(item.type)} {item.message}
                                    </p>
                                </div>
                            </CrystalCard>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
