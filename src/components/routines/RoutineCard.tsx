"use client";

import { motion } from "framer-motion";
import { CrystalCard } from "../crystal/CrystalCard";
import { Play, Clock, BarChart } from "lucide-react";
import Link from "next/link";

interface RoutineCardProps {
    id?: string;
    title: string;
    description: string;
    difficulty: "principiante" | "intermedio" | "avanzado";
    duration: number; // minutos
    exerciseCount: number;
    imageUrl?: string;
}

export function RoutineCard({ id, title, description, difficulty, duration, exerciseCount, imageUrl }: RoutineCardProps) {
    const difficultyColors = {
        principiante: "text-green-400 bg-green-400/10 border-green-400/20",
        intermedio: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
        avanzado: "text-red-400 bg-red-400/10 border-red-400/20",
    };

    return (
        <Link href={`/dashboard/routines/${id || 'demo'}/start`} className="block group">
            <CrystalCard className="p-0 hover:bg-white/5 transition-all cursor-pointer relative overflow-hidden" hoverEffect={true} tilt>
                <div className="relative h-48 w-full overflow-hidden rounded-t-2xl">
                    <div className="absolute inset-0 bg-deep-charcoal" />
                    {imageUrl && (
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110 opacity-60"
                            style={{ backgroundImage: `url(${imageUrl})` }}
                        />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-charcoal via-transparent to-transparent" />

                    <div className="absolute bottom-4 left-4 right-4">
                        <h3 className="text-xl font-bold text-white group-hover:text-neon-cyan transition-colors truncate">{title}</h3>
                        <p className="text-sm text-gray-300 line-clamp-1">{description}</p>
                    </div>

                    <div className="absolute top-4 right-4 h-10 w-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-md border border-white/20 group-hover:bg-neon-cyan group-hover:text-black transition-colors z-20">
                        <Play className="h-4 w-4 fill-current" />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-deep-charcoal/40">
                    <div className={`rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${difficultyColors[difficulty]}`}>
                        {difficulty}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{duration} min</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <BarChart className="h-3 w-3 rotate-90" />
                            <span>{exerciseCount} Ejer.</span>
                        </div>
                    </div>
                </div>
            </CrystalCard>
        </Link>
    );
}
