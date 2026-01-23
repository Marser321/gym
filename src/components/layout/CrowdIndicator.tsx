"use client";

import { useRealtimeCrowd } from "@/hooks/useRealtimeCrowd";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

export function CrowdIndicator() {
    const { count, level } = useRealtimeCrowd();

    const colors = {
        low: "bg-green-500 shadow-green-500/50",
        medium: "bg-yellow-500 shadow-yellow-500/50",
        high: "bg-red-500 shadow-red-500/50",
    };

    const textColors = {
        low: "text-green-400",
        medium: "text-yellow-400",
        high: "text-red-400",
    };

    return (
        <div className="flex items-center gap-3 rounded-full border border-white/5 bg-black/20 px-3 py-1.5 backdrop-blur-sm">
            <div className="relative">
                <Users className="h-4 w-4 text-gray-400" />
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${colors[level].split(' ')[0]}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[level].split(' ')[0]}`}></span>
                </span>
            </div>

            <div className="flex flex-col leading-none">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Aforo</span>
                <span className={`text-xs font-bold ${textColors[level]}`}>
                    {count} Personas
                </span>
            </div>
        </div>
    );
}
