"use client";

import { useGymMatch } from "@/hooks/useGymMatch";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { Users, Zap, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function GymMatchPage() {
    const { isLooking, matches, toggleLooking } = useGymMatch();

    return (
        <div className="flex flex-col items-center space-y-8 pb-24">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                    Gym <span className="text-neon-cyan">Match</span>
                </h1>
                <p className="text-gray-400 max-w-xs mx-auto">
                    Encuentra un spotter o compañero de entrenamiento en tiempo real.
                </p>
            </div>

            {/* Main Action Button */}
            <div className="relative">
                <motion.div
                    animate={isLooking ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`absolute inset-0 rounded-full blur-xl ${isLooking ? 'bg-neon-cyan/40' : 'bg-transparent'}`}
                />
                <CrystalButton
                    size="lg"
                    variant={isLooking ? "danger" : "primary"}
                    onClick={() => toggleLooking("General")} // Default exercise for now
                    className="h-32 w-32 rounded-full border-4 text-xl font-bold shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 relative"
                >
                    {isLooking ? "DETENER" : "BUSCAR"}
                </CrystalButton>
            </div>

            <div className="w-full max-w-md space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-neon-cyan" />
                        Disponibles Ahora
                    </h2>
                    <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded-full text-white">
                        {matches.length}
                    </span>
                </div>

                <div className="grid gap-4">
                    <AnimatePresence>
                        {matches.length > 0 ? (
                            matches.map((match) => (
                                <motion.div
                                    key={match.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                >
                                    <CrystalCard className="flex items-center justify-between p-4 border-l-4 border-l-neon-cyan">
                                        <div className="flex items-center gap-4">
                                            <div className="relative h-12 w-12 rounded-full overflow-hidden border border-white/20">
                                                <Image
                                                    src={match.profiles?.avatar_url || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop"}
                                                    alt={match.profiles?.full_name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{match.profiles?.full_name}</h3>
                                                <p className="text-xs text-neon-cyan flex items-center gap-1">
                                                    <Zap className="h-3 w-3" />
                                                    Entrenando: {match.exercise_type}
                                                </p>
                                            </div>
                                        </div>
                                        <CrystalButton size="sm" variant="ghost" className="rounded-full h-10 w-10 p-0 border border-white/10">
                                            👋
                                        </CrystalButton>
                                    </CrystalCard>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-10 opacity-50"
                            >
                                <p className="text-gray-400">No hay nadie buscando spotter ahora.</p>
                                <p className="text-xs text-gray-600 mt-2">¡Sé el primero en iniciar!</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
