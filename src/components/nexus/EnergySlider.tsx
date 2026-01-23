"use client";

import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface EnergySliderProps {
    value: number;
    onChange: (val: number) => void;
}

export function EnergySlider({ value, onChange }: EnergySliderProps) {
    return (
        <div className="w-full space-y-6">
            <div className="flex justify-between text-sm uppercase tracking-widest text-gray-500">
                <span>Drenado</span>
                <span>Óptimo</span>
                <span>Sobrecarga</span>
            </div>

            <div className="relative h-16 w-full rounded-2xl bg-deep-charcoal border border-white/5 overflow-hidden">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.05)_50%,transparent_100%)] bg-[length:20px_100%]" />

                {/* Fill Bar */}
                <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-500 via-neon-cyan to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${value}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </motion.div>

                {/* Interactive Area */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {/* Value Indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-white drop-shadow-md flex items-center gap-2">
                        <Zap className={`h-6 w-6 ${value > 80 ? 'text-yellow-300 fill-current' : 'text-white'}`} />
                        {value}%
                    </span>
                </div>
            </div>

            <p className="text-center text-xs text-neon-cyan/70 font-mono">
                {value < 30 && ">> ADVERTENCIA: NIVELES BAJOS DETECTADOS <<"}
                {value >= 30 && value < 80 && ">> ESTADO OPERATIVO NOMINAL <<"}
                {value >= 80 && ">> POTENCIA MÁXIMA DISPONIBLE <<"}
            </p>
        </div>
    );
}
