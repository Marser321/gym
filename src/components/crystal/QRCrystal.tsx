"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
// En un caso real usaríamos una librería como 'qrcode.react', 
// aquí simularemos el QR visualmente para la demo estética o usaremos un placeholder SVG.
// Para ser funcionales instalaremos qrcode.react luego si el usuario confirma.
import { QRCodeSVG } from "qrcode.react"; // Necesitaremos instalar esto: npm i qrcode.react

interface QRCrystalProps {
    token: string;
    userName: string;
}

export function QRCrystal({ token, userName }: QRCrystalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="relative flex flex-col items-center justify-center">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative p-6 glass-card rounded-3xl border border-neon-cyan/20 bg-black/40"
            >
                {/* Decorative Corner Brackets */}
                <div className="absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-neon-cyan rounded-tl-lg" />
                <div className="absolute top-4 right-4 h-8 w-8 border-t-2 border-r-2 border-neon-cyan rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-neon-cyan rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-neon-cyan rounded-br-lg" />

                {/* QR Code */}
                <div className="relative z-10 bg-white p-2 rounded-xl overflow-hidden">
                    <QRCodeSVG
                        value={token}
                        size={200}
                        level="H"
                        includeMargin={true}
                        fgColor="#000000"
                        bgColor="#ffffff"
                    />

                    {/* Scanning Animation Overlay */}
                    <motion.div
                        className="absolute inset-0 bg-neon-cyan/20 h-1 w-full"
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                        style={{ filter: "blur(2px)", boxShadow: "0 0 10px #00f3ff" }}
                    />
                </div>

                {/* Status Indicator */}
                <div className="mt-4 flex items-center justify-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-xs font-medium text-neon-cyan tracking-widest uppercase">Acceso Activo</span>
                </div>
            </motion.div>

            <p className="mt-4 text-sm text-gray-400 font-medium">
                {userName}
            </p>
        </div>
    );
}
