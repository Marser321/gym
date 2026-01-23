"use client";

import { motion } from "framer-motion";
import { CrystalCard } from "../crystal/CrystalCard";
import { Trophy, Star, Zap } from "lucide-react";

interface LevelProgressProps {
    level: number;
    xp: number;
    nextLevelXp: number;
    rankName: string; // Bronce, Plata, Oro, Diamante, Vibranium
}

export function LevelProgress({ level, xp, nextLevelXp, rankName }: LevelProgressProps) {
    const progressPercent = (xp / nextLevelXp) * 100;

    const rankColors: Record<string, string> = {
        Bronce: "text-orange-400 border-orange-400/30 bg-orange-400/10",
        Plata: "text-gray-300 border-gray-300/30 bg-gray-300/10",
        Oro: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
        Diamante: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
        Vibranium: "text-purple-500 border-purple-500/30 bg-purple-500/10",
    };

    const currentColor = rankColors[rankName] || rankColors["Bronce"];
    const colorHex = currentColor.split("-")[1]; // extract color name roughly

    return (
        <CrystalCard className="relative overflow-hidden" tilt>
            {/* Background Particles/Glow */}
            <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[60px] opacity-20 bg-${colorHex}-500`} />

            <div className="flex items-center gap-4 relative z-10">
                {/* Level Hexagon */}
                <div className="relative flex items-center justify-center w-16 h-16">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className={`absolute inset-0 border-2 border-dashed rounded-full ${currentColor.split(" ")[1]}`}
                    />
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full border ${currentColor} shadow-[0_0_15px_rgba(0,0,0,0.3)]`}>
                        <span className="font-black text-xl text-white">{level}</span>
                    </div>
                </div>

                <div className="flex-1 space-y-1">
                    <div className="flex justify-between items-center px-1">
                        <span className={`text-sm font-bold uppercase tracking-wider ${currentColor.split(" ")[0]}`}>
                            Rango {rankName}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">
                            {xp} / {nextLevelXp} XP
                        </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 backdrop-blur-sm relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r from-${colorHex}-600 to-${colorHex}-400 relative`}
                        >
                            {/* Shine effect on bar */}
                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50 blur-[1px]" />
                        </motion.div>
                    </div>

                    <div className="flex justify-end">
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Zap className="h-3 w-3 text-neon-cyan" /> Próxima recompensa: +5% descuento
                        </span>
                    </div>
                </div>
            </div>
        </CrystalCard>
    );
}
