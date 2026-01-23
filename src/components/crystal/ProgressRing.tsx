"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
    progress: number; // 0 to 100
    size?: number;
    strokeWidth?: number;
    color?: string;
    trackColor?: string;
    label?: string;
    sublabel?: string;
    className?: string;
}

export const ProgressRing = ({
    progress,
    size = 120,
    strokeWidth = 8,
    color = "#00f3ff", // neon-cyan
    trackColor = "rgba(255,255,255,0.1)",
    label,
    sublabel,
    className,
}: ProgressRingProps) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>

            {/* Background Glow */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-20"
                style={{
                    background: color,
                    transform: `scale(${0.8 + (progress / 100) * 0.2})`
                }}
            />

            <svg width={size} height={size} className="transform -rotate-90">
                {/* Track */}
                <circle
                    stroke={trackColor}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                {/* Progress */}
                <motion.circle
                    stroke={color}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    className="drop-shadow-[0_0_4px_rgba(0,243,255,0.5)]"
                />
            </svg>

            {/* Inner Label */}
            {(label || sublabel) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    {label && (
                        <span className="text-2xl font-bold text-white tracking-tighter drop-shadow-md">
                            {label}
                        </span>
                    )}
                    {sublabel && (
                        <span className="text-[10px] uppercase tracking-widest text-white/60 font-medium mt-1">
                            {sublabel}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};
