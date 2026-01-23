"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CrystalCard } from "@/components/crystal/CrystalCard";
import { Lock, ArrowRight, Delete } from "lucide-react";

export default function AdminLoginPage() {
    const [pin, setPin] = useState("");
    const [error, setError] = useState(false);
    const router = useRouter();

    const handleNumClick = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (pin === "0000") {
            // Set simple cookie for demo purposes
            document.cookie = "admin_access=true; path=/";
            router.push("/admin/dashboard");
        } else {
            setError(true);
            setPin("");
            // Vibrate if supported
            if (navigator.vibrate) navigator.vibrate(200);
        }
    };

    // Auto-submit when pin is 4 digits
    if (pin.length === 4) {
        // Small delay for UX
        setTimeout(() => handleSubmit(), 200);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-deep-charcoal p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[120px]" />

            <CrystalCard className="w-full max-w-sm p-8 flex flex-col items-center gap-8 relative z-10" tilt>
                <div className="flex flex-col items-center gap-2">
                    <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${error ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-shake' : 'bg-white/5 text-white border border-white/10'}`}>
                        <Lock className="h-8 w-8" />
                    </div>
                    <h1 className="text-xl font-bold text-white tracking-widest">ADMIN GATE</h1>
                    <p className="text-xs text-gray-400">Ingrese PIN de Seguridad</p>
                </div>

                {/* PIN Dots */}
                <div className="flex gap-4 mb-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className={`h-4 w-4 rounded-full border border-white/20 transition-all duration-200 ${i < pin.length ? 'bg-neon-cyan scale-110 shadow-[0_0_10px_rgba(0,243,255,0.5)]' : 'bg-transparent'}`} />
                    ))}
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-6 w-full">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumClick(num.toString())}
                            className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all border border-transparent hover:border-white/10 mx-auto"
                        >
                            {num}
                        </button>
                    ))}
                    <div /> {/* spacer */}
                    <button
                        onClick={() => handleNumClick("0")}
                        className="h-16 w-16 rounded-full flex items-center justify-center text-2xl font-bold text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all border border-transparent hover:border-white/10 mx-auto"
                    >
                        0
                    </button>
                    <button
                        onClick={handleDelete}
                        className="h-16 w-16 rounded-full flex items-center justify-center text-xl text-gray-400 hover:text-white hover:bg-white/5 active:scale-95 transition-all mx-auto"
                    >
                        <Delete className="h-6 w-6" />
                    </button>
                </div>
            </CrystalCard>
        </div>
    );
}
