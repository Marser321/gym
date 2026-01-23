"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CrystalCard } from "../crystal/CrystalCard";
import { CrystalButton } from "../crystal/CrystalButton";
import { X, Check } from "lucide-react";
import { useState } from "react";

interface BookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    trainerName: string;
    hourlyRate: number;
}

export function BookingModal({ isOpen, onClose, trainerName, hourlyRate }: BookingModalProps) {
    const [selectedPack, setSelectedPack] = useState<"hora" | "pack5" | "pack10">("hora");

    const packs = [
        { id: "hora", label: "Sesión Única", discount: 0, price: hourlyRate },
        { id: "pack5", label: "Pack 5 Sesiones", discount: 0.10, price: hourlyRate * 5 * 0.9 },
        { id: "pack10", label: "Pack 10 Sesiones", discount: 0.15, price: hourlyRate * 10 * 0.85 },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="z-10 w-full max-w-lg"
                    >
                        <CrystalCard className="border-neon-cyan/20 bg-deep-charcoal/90">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Contratar a <span className="text-neon-cyan">{trainerName}</span></h2>
                                <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10 transition-colors">
                                    <X className="h-5 w-5 text-gray-400" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-8">
                                {packs.map((pack) => (
                                    <div
                                        key={pack.id}
                                        onClick={() => setSelectedPack(pack.id as any)}
                                        className={`relative cursor-pointer rounded-xl border p-4 transition-all ${selectedPack === pack.id
                                                ? "bg-neon-cyan/10 border-neon-cyan ring-1 ring-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.15)]"
                                                : "bg-white/5 border-white/10 hover:bg-white/10"
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold text-white">{pack.label}</span>
                                            <span className="font-bold text-neon-cyan">${pack.price.toFixed(0)}</span>
                                        </div>
                                        {pack.discount > 0 && (
                                            <div className="mt-1 text-xs text-green-400">
                                                Ahorras {pack.discount * 100}%
                                            </div>
                                        )}
                                        {selectedPack === pack.id && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
                                                <Check className="h-10 w-10 text-neon-cyan" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3">
                                <CrystalButton variant="ghost" onClick={onClose} className="flex-1">
                                    Cancelar
                                </CrystalButton>
                                <CrystalButton className="flex-1 font-bold">
                                    Confirmar y Pagar
                                </CrystalButton>
                            </div>
                        </CrystalCard>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
