"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BodyPart } from "@/lib/nexus-ai";

interface BodyMapMobileProps {
    selectedParts: BodyPart[];
    onToggle: (part: BodyPart) => void;
}

export function BodyMapMobile({ selectedParts, onToggle }: BodyMapMobileProps) {
    const parts: { id: BodyPart; label: string; x: string; y: string }[] = [
        { id: "shoulders", label: "Hombros", x: "20%", y: "20%" },
        { id: "chest", label: "Pecho", x: "60%", y: "25%" },
        { id: "back", label: "Espalda", x: "40%", y: "40%" },
        { id: "legs", label: "Piernas", x: "30%", y: "70%" },
        { id: "knees", label: "Rodillas", x: "70%", y: "75%" },
    ];

    return (
        <div className="relative h-[400px] w-full rounded-2xl bg-deep-charcoal border border-white/5 overflow-hidden flex items-center justify-center">
            {/* Grid Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.05)_0%,transparent_70%)]" />

            {/* Silhouette Placeholder (Abstract Cyber Shape) */}
            <div className="relative h-64 w-32 opacity-20">
                <div className="absolute inset-0 bg-white blur-xl rounded-full" />
            </div>

            {/* Interactive Points */}
            {parts.map((part) => {
                const isSelected = selectedParts.includes(part.id);
                return (
                    <motion.button
                        key={part.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onToggle(part.id)}
                        className={cn(
                            "absolute flex flex-col items-center justify-center h-20 w-20 rounded-full border transition-all duration-300",
                            isSelected
                                ? "bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                                : "bg-white/5 border-white/10 text-gray-500 hover:border-white/30"
                        )}
                        style={{ top: part.y, left: part.x }}
                    >
                        <span className="text-xs font-bold uppercase">{part.label}</span>
                        {isSelected && <span className="text-[10px] animate-pulse">DAÑADO</span>}
                    </motion.button>
                );
            })}

            <p className="absolute bottom-4 text-xs text-center text-gray-500 w-full px-4">
                Toca las zonas con dolor o fatiga para excluirlas del protocolo.
            </p>
        </div>
    );
}
