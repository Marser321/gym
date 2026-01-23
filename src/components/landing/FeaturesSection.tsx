"use client";

import { Brain, Users, Activity, Zap, Trophy, Smartphone } from "lucide-react";
import { FeatureCard } from "./FeatureCard";
import { motion } from "framer-motion";

const features = [
    {
        title: "Nexus AI Coach",
        description: "Nuestro algoritmo de calibración biométrica diseña tu rutina perfecta en segundos, adaptándose a tu energía diaria.",
        icon: Brain,
    },
    {
        title: "Comunidad Élite",
        description: "Encuentra tu 'Gym Match' ideal, compite en rankings semanales y comparte logros con atletas de tu nivel.",
        icon: Users,
    },
    {
        title: "Tracking Avanzado",
        description: "Visualiza tu progreso con métricas de nivel profesional. Gráficos de fuerza, cardio y consistencia en tiempo real.",
        icon: Activity,
    },
    {
        title: "Energía & Recuperación",
        description: "Protocolos inteligentes que priorizan tu salud a largo plazo, evitando lesiones y maximizando el rendimiento.",
        icon: Zap,
    },
    {
        title: "Gamificación Real",
        description: "Sube de nivel, desbloquea medallas y alcanza el rango 'Oro'. Tu esfuerzo físico tiene recompensas digitales y reales.",
        icon: Trophy,
    },
    {
        title: "Experiencia 100% Móvil",
        description: "Una PWA diseñada para el gimnasio. Sin esperas, sin anuncios, fluida y con modo offline para zonas sin cobertura.",
        icon: Smartphone,
    },
];

export function FeaturesSection() {
    return (
        <section className="relative py-24 bg-black">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            <div className="container mx-auto px-4">
                <div className="mb-16 text-center max-w-3xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight text-glow"
                    >
                        MÁS QUE UN GIMNASIO, <br />
                        <span className="text-neon-cyan">UNA EVOLUCIÓN.</span>
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        viewport={{ once: true }}
                        className="text-gray-400 text-lg"
                    >
                        Descubre la tecnología que está cambiando la forma de entrenar.
                        No te adaptes al sistema, deja que el sistema se adapte a ti.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {features.map((feature, i) => (
                        <FeatureCard
                            key={i}
                            {...feature}
                            delay={i * 0.1}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
