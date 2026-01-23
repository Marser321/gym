"use client";

import { motion } from "framer-motion";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Timer, CheckCircle, Play, Pause, SkipForward, ArrowLeft, Activity, Heart, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function StartRoutinePage() {
    const params = useParams();
    const router = useRouter();
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [currentSet, setCurrentSet] = useState(1);
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
        let interval: any = null;
        if (isActive) {
            interval = setInterval(() => {
                setSeconds((seconds) => seconds + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    if (isFinished) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full text-center space-y-8"
                >
                    <div className="relative mx-auto w-32 h-32">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 10 }}
                            className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-2xl"
                        />
                        <div className="relative z-10 w-full h-full rounded-full border-2 border-neon-cyan bg-black flex items-center justify-center">
                            <Trophy className="h-16 w-16 text-neon-cyan" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">¡ENTRENAMIENTO COMPLETADO!</h1>
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Has ganado +150 XP • Rango Oro progresando</p>
                    </div>

                    <CrystalCard className="p-6 grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase font-black">Tiempo Total</p>
                            <p className="text-xl font-black text-white">{formatTime(seconds)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase font-black">Calorías Est.</p>
                            <p className="text-xl font-black text-white">420 KCAL</p>
                        </div>
                    </CrystalCard>

                    <Link href="/dashboard" className="block">
                        <CrystalButton className="w-full h-14 font-black tracking-widest text-lg">
                            VOLVER AL PANEL
                        </CrystalButton>
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button onClick={() => router.back()} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="flex flex-col items-center">
                    <div className="text-2xl font-black font-mono text-neon-cyan tracking-tighter shadow-neon-cyan">
                        {formatTime(seconds)}
                    </div>
                </div>
                <div className="w-10" /> {/* Spacer */}
            </div>

            {/* Exercise Info */}
            <CrystalCard className="p-0 overflow-hidden relative" hoverEffect={false}>
                <div className="h-48 w-full relative">
                    <img
                        src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470"
                        alt="Exercise"
                        className="w-full h-full object-cover opacity-60"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                        <span className="text-[10px] font-black text-neon-cyan uppercase tracking-[0.3em] mb-1 block">Ejercicio 1 de 8</span>
                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Press de Banca</h2>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="flex justify-around items-center">
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Set</p>
                            <p className="text-3xl font-black text-white italic">{currentSet} / 4</p>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10" />
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Reps</p>
                            <p className="text-3xl font-black text-white italic">10-12</p>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10" />
                        <div className="text-center">
                            <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Peso</p>
                            <p className="text-3xl font-black text-white italic">60<span className="text-sm font-normal not-italic ml-1">KG</span></p>
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-6">
                        <button
                            onClick={() => setIsActive(!isActive)}
                            className="h-20 w-20 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                        >
                            {isActive ? <Pause className="h-8 w-8 fill-current" /> : <Play className="h-8 w-8 fill-current ml-1" />}
                        </button>

                        <button
                            onClick={() => {
                                if (currentSet < 4) setCurrentSet(prev => prev + 1);
                                else setIsFinished(true);
                            }}
                            className="h-16 w-16 rounded-full bg-neon-cyan text-black flex items-center justify-center hover:bg-cyan-300 transition-all shadow-[0_0_25px_rgba(0,243,255,0.4)]"
                        >
                            <CheckCircle className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </CrystalCard>

            {/* AI Insights Sidebar-like cards */}
            <div className="grid grid-cols-2 gap-4">
                <CrystalCard className="p-4 bg-neon-cyan/5 border-neon-cyan/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-neon-cyan" />
                        <span className="text-[10px] font-black text-white uppercase italic">Nexus AI Tip</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium">Controla la fase excéntrica (bajada) para mayor reclutamiento de fibras.</p>
                </CrystalCard>
                <CrystalCard className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <span className="text-[10px] font-black text-white uppercase italic">Cardio Stat</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-relaxed font-medium italic">Frecuencia cardíaca ideal para hipertrofia: 135 BPM.</p>
                </CrystalCard>
            </div>
        </div>
    );
}

// Support Trophy for build
function Trophy({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    );
}
