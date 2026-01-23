"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CrystalButton } from "../crystal/CrystalButton";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { EnergySlider } from "./EnergySlider";
import { BodyMapMobile } from "./BodyMapMobile";
import { RoutineSynthesizer } from "./RoutineSynthesizer";
import { BodyPart, CalibrationData } from "@/lib/nexus-ai";

export function CalibrationFlow() {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<CalibrationData>({
        energy: 75,
        soreness: [],
        timeAvailable: 60
    });

    const handleNext = () => setStep(prev => prev + 1);
    const handleBack = () => setStep(prev => prev - 1);

    const updateEnergy = (val: number) => setData(prev => ({ ...prev, energy: val }));

    const toggleBodyPart = (part: BodyPart) => {
        setData(prev => {
            if (prev.soreness.includes(part)) {
                return { ...prev, soreness: prev.soreness.filter(p => p !== part) };
            }
            return { ...prev, soreness: [...prev.soreness, part] };
        });
    };

    const steps = [
        {
            title: "Nivel de Energía",
            subtitle: "¿Cuánta potencia tienes disponible hoy?",
            component: <EnergySlider value={data.energy} onChange={updateEnergy} />
        },
        {
            title: "Escaneo de Integridad",
            subtitle: "Reporta zonas dañadas o fatigadas para exclusión.",
            component: <BodyMapMobile selectedParts={data.soreness} onToggle={toggleBodyPart} />
        },
        // Step 2 is Synthesis (handled conditionally)
    ];

    if (step >= steps.length) {
        return <RoutineSynthesizer data={data} />;
    }

    return (
        <div className="max-w-md mx-auto w-full">
            {/* Progress Bar */}
            <div className="flex gap-2 mb-8">
                {steps.map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-neon-cyan' : 'bg-white/10'}`}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -20, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">{steps[step].title}</h2>
                        <p className="text-gray-400">{steps[step].subtitle}</p>
                    </div>

                    <div className="mb-8 min-h-[300px] flex items-center">
                        {steps[step].component}
                    </div>

                    <div className="flex justify-between gap-4">
                        <button
                            onClick={handleBack}
                            disabled={step === 0}
                            className={`p-4 rounded-xl border border-white/10 text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed`}
                        >
                            <ArrowLeft className="h-6 w-6" />
                        </button>

                        <CrystalButton
                            className="flex-1 text-lg"
                            onClick={handleNext}
                        >
                            {step === steps.length - 1 ? 'Iniciar Síntesis' : 'Confirmar'}
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </CrystalButton>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
