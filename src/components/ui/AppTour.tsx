"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, HelpCircle } from "lucide-react";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import Image from "next/image";

const TOUR_STEPS = [
    {
        id: "welcome",
        title: "Bienvenido a Nexus AI",
        description: "Soy tu asistente inteligente. Estoy aquí para llevar tu entrenamiento al siguiente nivel. ¿Empezamos el recorrido?",
        image: "/tour_welcome.png",
        highlight: "Inicio"
    },
    {
        id: "dashboard",
        title: "Tu Centro de Comando",
        description: "Aquí visualizarás tus métricas clave, próximos entrenamientos y estado físico en tiempo real. Todo lo que necesitas en un solo vistazo.",
        image: "/tour_progress.png",
        highlight: "Dashboard"
    },
    {
        id: "routines",
        title: "Entrenamiento de Élite",
        description: "Accede a rutinas diseñadas científicamente. Sigue protocolos avanzados, registra tus cargas y supera tus límites cada día.",
        image: "/tour_routines.png",
        highlight: "Rutinas"
    },
    {
        id: "community",
        title: "Comunidad Global",
        description: "Conecta con atletas de tu nivel. Comparte logros, encuentra tu 'Gym Partner' y compite en los rankings globales.",
        image: "/tour_community.png",
        highlight: "Comunidad"
    }
];

export function AppTour() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);

    // Auto-open on first visit could be implemented with localStorage
    useEffect(() => {
        const hasSeenTour = localStorage.getItem("has_seen_tour");
        if (!hasSeenTour) {
            // setTimeout(() => setIsOpen(true), 2000); // Optional auto-open
        }
    }, []);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        localStorage.setItem("has_seen_tour", "true");
        setCurrentStep(0);
    };

    return (
        <>
            {/* Floating Help Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-24 right-6 z-40 md:bottom-8 h-12 w-12 rounded-full bg-neon-cyan text-black flex items-center justify-center shadow-[0_0_20px_rgba(0,243,255,0.4)] border border-white/20"
            >
                <HelpCircle className="h-6 w-6" />
            </motion.button>

            {/* Tour Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-black/90 border border-white/10 rounded-3xl overflow-hidden w-full max-w-lg shadow-[0_0_50px_rgba(0,243,255,0.15)] relative"
                        >
                            {/* Decorative Elements */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-cyan via-purple-500 to-blue-500" />
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-cyan/20 blur-[80px] rounded-full pointer-events-none" />

                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>

                            {/* Content */}
                            <div className="relative">
                                {/* Image Area with Parallax-like effect */}
                                <div className="relative h-64 w-full overflow-hidden">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, scale: 1.1 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.5 }}
                                        className="w-full h-full"
                                    >
                                        <Image
                                            src={TOUR_STEPS[currentStep].image}
                                            alt={TOUR_STEPS[currentStep].title}
                                            fill
                                            className="object-cover"
                                            priority
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                                    </motion.div>
                                </div>

                                {/* Text Content */}
                                <div className="p-8 pt-4 relative">
                                    <motion.div
                                        key={currentStep}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-3"
                                    >
                                        <div className="inline-block px-3 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-[10px] font-black uppercase tracking-widest mb-2">
                                            {currentStep + 1} / {TOUR_STEPS.length} • {TOUR_STEPS[currentStep].highlight}
                                        </div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">
                                            {TOUR_STEPS[currentStep].title}
                                        </h3>
                                        <p className="text-gray-400 leading-relaxed text-sm">
                                            {TOUR_STEPS[currentStep].description}
                                        </p>
                                    </motion.div>
                                </div>

                                {/* Controls */}
                                <div className="p-8 pt-0 flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {TOUR_STEPS.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-neon-cyan' : 'w-2 bg-gray-700'}`}
                                            />
                                        ))}
                                    </div>

                                    <div className="flex gap-3">
                                        {currentStep > 0 && (
                                            <button
                                                onClick={handlePrev}
                                                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                                            >
                                                <ChevronLeft className="h-5 w-5" />
                                            </button>
                                        )}
                                        <CrystalButton onClick={handleNext} className="gap-2 px-6">
                                            {currentStep === TOUR_STEPS.length - 1 ? 'COMENZAR' : 'SIGUIENTE'}
                                            {currentStep !== TOUR_STEPS.length - 1 && <ChevronRight className="h-4 w-4" />}
                                        </CrystalButton>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
