"use client";

import { motion } from "framer-motion";
import { Home, Dumbbell, Users, User, QrCode } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
    { href: "/dashboard", label: "Inicio", icon: Home },
    { href: "/dashboard/routines", label: "Rutinas", icon: Dumbbell },
    { href: "/dashboard/qr", label: "Acceso", icon: QrCode, isFab: true },
    { href: "/dashboard/community", label: "Buzz", icon: Users },
    { href: "/dashboard/profile", label: "Perfil", icon: User },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 md:hidden">
            <div className="glass flex h-16 items-center justify-around rounded-2xl px-2 shadow-2xl backdrop-blur-xl">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    if (item.isFab) {
                        return (
                            <Link key={item.href} href={item.href}>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    className="relative -top-8 flex h-14 w-14 items-center justify-center rounded-full bg-neon-cyan text-black shadow-[0_0_20px_rgba(0,243,255,0.4)] border border-white/20"
                                >
                                    <Icon className="h-6 w-6" />
                                </motion.div>
                            </Link>
                        );
                    }

                    return (
                        <Link key={item.href} href={item.href} className="relative flex flex-col items-center justify-center p-2">
                            <div className={cn("transition-colors duration-300", isActive ? "text-neon-cyan" : "text-gray-400 group-hover:text-white")}>
                                <Icon className={cn("h-6 w-6", isActive && "drop-shadow-[0_0_8px_rgba(0,243,255,0.6)]")} />
                            </div>
                            {isActive && (
                                <motion.div
                                    layoutId="nav-indicator"
                                    className="absolute -bottom-1 h-1 w-1 rounded-full bg-neon-cyan shadow-[0_0_5px_rgba(0,243,255,0.8)]"
                                />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
