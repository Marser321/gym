"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { CrystalCard } from "../crystal/CrystalCard";

interface FeatureCardProps {
    title: string;
    description: string;
    icon: LucideIcon;
    delay?: number;
}

export function FeatureCard({ title, description, icon: Icon, delay = 0 }: FeatureCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true }}
            className="h-full"
        >
            <CrystalCard className="h-full p-8 group transition-all duration-300 hover:bg-white/5 hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(0,243,255,0.15)]" tilt>
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-transform group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white group-hover:text-neon-cyan transition-colors">
                    {title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                    {description}
                </p>
            </CrystalCard>
        </motion.div>
    );
}
