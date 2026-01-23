"use client";

import { motion } from "framer-motion";
import { Lock, CheckCircle2 } from "lucide-react";

interface AchievementBadgeProps {
    name: string;
    icon: React.ReactNode;
    isUnlocked: boolean;
    description: string;
}

export function AchievementBadge({ name, icon, isUnlocked, description }: AchievementBadgeProps) {
    return (
        <div className="group relative flex flex-col items-center gap-2">
            <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`relative flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-300 ${isUnlocked
                        ? "bg-gradient-to-br from-white/10 to-white/5 border-neon-cyan/30 shadow-[0_0_15px_rgba(0,243,255,0.15)]"
                        : "bg-black/40 border-white/5 grayscale opacity-50"
                    }`}
            >
                <div className={isUnlocked ? "text-neon-cyan" : "text-gray-600"}>
                    {icon}
                </div>

                {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl backdrop-blur-[1px]">
                        <Lock className="h-4 w-4 text-gray-400" />
                    </div>
                )}

                {/* Shine effect */}
                {isUnlocked && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/0 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
            </motion.div>

            <span className={`text-[10px] font-bold uppercase tracking-wider text-center max-w-[80px] leading-tight ${isUnlocked ? 'text-white' : 'text-gray-600'}`}>
                {name}
            </span>

            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 hidden w-32 rounded-lg border border-white/10 bg-black/90 p-2 text-center text-[10px] text-gray-300 backdrop-blur-md group-hover:block z-50">
                {description}
            </div>
        </div>
    );
}
