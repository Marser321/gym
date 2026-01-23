"use client";

import { motion } from "framer-motion";
import { Home, Dumbbell, Users, User, QrCode, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const navItems = [
    { href: "/dashboard", label: "Inicio", icon: Home },
    { href: "/dashboard/routines", label: "Rutinas", icon: Dumbbell },
    { href: "/dashboard/community", label: "Comunidad", icon: Users },
    { href: "/dashboard/profile", label: "Perfil", icon: User },
    { href: "/dashboard/qr", label: "Acceso QR", icon: QrCode },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <aside className="hidden w-64 flex-col border-r border-white/5 bg-deep-charcoal/50 backdrop-blur-xl md:flex">
            <div className="flex h-20 items-center justify-center border-b border-white/5 px-6">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
                        <Dumbbell className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white text-glow">
                        GYM PREMIUM
                    </span>
                </Link>
            </div>

            <nav className="flex-1 space-y-2 p-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                isActive
                                    ? "bg-neon-cyan/10 text-neon-cyan shadow-[0_0_10px_rgba(0,243,255,0.1)]"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]")} />
                            {item.label}
                        </Link>
                    );
                })}

                <div className="pt-4 mt-4 border-t border-white/5">
                    <Link
                        href="/dashboard/qr"
                        className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
                    >
                        <QrCode className="h-5 w-5" />
                        Acceso QR
                    </Link>
                </div>
            </nav>

            <div className="border-t border-white/5 p-4">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                    <LogOut className="h-5 w-5" />
                    Cerrar Sesión
                </button>
            </div>
        </aside>
    );
}
