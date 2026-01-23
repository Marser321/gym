"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CrystalCard } from "../crystal/CrystalCard";
import { CalibrationData, GeneratedRoutine, synthesizeRoutine } from "@/lib/nexus-ai";
import { Check, Dumbbell, Timer, Zap } from "lucide-react";
import Link from "next/link";
import { CrystalButton } from "../crystal/CrystalButton";

interface RoutineSynthesizerProps {
    data: CalibrationData;
}

export function RoutineSynthesizer({ data }: RoutineSynthesizerProps) {
    const [status, setStatus] = useState<"analyzing" | "compiling" | "ready">("analyzing");
    const [routine, setRoutine] = useState<GeneratedRoutine | null>(null);

    useEffect(() => {
        // Simulate AI Processing
        const t1 = setTimeout(() => setStatus("compiling"), 2000);
        const t2 = setTimeout(() => {
            setRoutine(synthesizeRoutine(data));
            setStatus("ready");
        }, 4500);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [data]);

    if (status !== "ready") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8">
                <div className="relative h-32 w-32">
                    <motion.div
                        className="absolute inset-0 rounded-full border-t-4 border-neon-cyan"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="absolute inset-4 rounded-full border-r-4 border-purple-500"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-neon-cyan">
                        {status === "analyzing" ? "ANALIZANDO" : "SINTETIZANDO"}
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-neon-cyan/80 font-mono text-sm animate-pulse">
                        &gt; Procesando biometría...
                    </p>
                    <p className="text-gray-500 text-xs">
                        {status === "analyzing" ? "Evaluando niveles de energía y fatiga..." : "Construyendo protocolo óptimo..."}
                    </p>
                </div>
            </div>
        );
    }

    if (!routine) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
        >
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 mb-2">
                    <Check className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-white">Protocolo Generado</h2>
                <p className="text-gray-400 text-sm">Nexus AI ha diseñado esto para ti hoy.</p>
            </div>

            <CrystalCard className="p-6 border-neon-cyan/50 shadow-[0_0_30px_rgba(0,243,255,0.15)]" hoverEffect>
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white mb-1">{routine.title}</h3>
                        <div className="flex gap-2">
                            {routine.tags.map(tag => (
                                <span key={tag} className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/10 text-gray-300">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-gray-400">Intensidad</div>
                        <div className={`font-bold ${routine.intensity === 'High' ? 'text-red-400' : 'text-neon-cyan'}`}>
                            {routine.intensity}
                        </div>
                    </div>
                </div>

                <p className="text-gray-300 text-sm mb-6 bg-white/5 p-3 rounded-lg border-l-2 border-neon-cyan">
                    {routine.description}
                </p>

                <div className="space-y-3 mb-8">
                    {routine.exercises.map((ex, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded bg-black/20 hover:bg-white/5 transition-colors">
                            <span className="font-medium text-white">{ex.name}</span>
                            <span className="text-xs font-mono text-neon-cyan bg-neon-cyan/5 px-2 py-1 rounded">
                                {ex.sets} x {ex.reps}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Timer className="h-4 w-4" /> {routine.duration} min
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Zap className="h-4 w-4" /> +250 XP
                    </div>
                </div>
            </CrystalCard>

            <Link href="/dashboard" className="block">
                <CrystalButton className="w-full" size="lg">
                    INICIAR SESIÓN (+250 XP)
                </CrystalButton>
            </Link>
        </motion.div>
    );
}
