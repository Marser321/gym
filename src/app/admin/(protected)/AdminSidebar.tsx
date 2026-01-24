"use client";

import { LayoutDashboard, Users, CreditCard, Dumbbell, Settings, LogOut, UserPlus, UserCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSidebar({ pendingCount = 0, role = "member" }: { pendingCount?: number, role?: string }) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        // Clear the admin access cookie
        document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT";

        // Force refresh and redirect
        router.push("/admin/login");
        router.refresh();
    };

    const isAdmin = role === "admin";
    const isTrainer = role === "trainer";

    // Base items for everyone in the admin panel
    const baseItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard", roles: ["admin", "trainer"] },
    ];

    const adminSpecificItems = [
        { icon: Users, label: "Socios", href: "/admin/members", roles: ["admin"] },
        { icon: UserCheck, label: "Entrenadores", href: "/admin/trainers", roles: ["admin"] },
        { icon: UserPlus, label: "Solicitudes", href: "/admin/applications", roles: ["admin"] },
        { icon: CreditCard, label: "Pagos", href: "/admin/finance", roles: ["admin"] },
        { icon: Dumbbell, label: "Servicios", href: "/admin/services", roles: ["admin"] },
        { icon: Dumbbell, label: "Ejercicios", href: "/admin/exercises", roles: ["admin", "trainer"] },
        { icon: LayoutDashboard, label: "Rutinas", href: "/admin/routines", roles: ["admin", "trainer"] },
        { icon: Settings, label: "Configuración", href: "/admin/settings", roles: ["admin"] },
    ];

    const trainerSpecificItems = [
        { icon: Users, label: "Mis Clientes", href: "/admin/my-clients", roles: ["trainer"] },
    ];

    const allItems = [...baseItems, ...trainerSpecificItems, ...adminSpecificItems];
    const menuItems = allItems.filter(item => item.roles.includes(role));

    return (
        <aside className="hidden w-64 flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl md:flex">
            <div className="flex h-16 items-center border-b border-white/5 px-6">
                <span className="text-xl font-bold tracking-tight text-white">
                    GYM <span className="text-neon-cyan">ADMIN</span>
                </span>
            </div>

            <nav className="flex-1 space-y-1 p-4">
                {menuItems.map((item) => {
                    const showBadge = item.label === "Solicitudes" && pendingCount > 0;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center justify-between rounded-xl px-4 py-3 text-gray-400 hover:bg-white/5 hover:text-white transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <item.icon className="h-5 w-5" />
                                <span className="font-medium">{item.label}</span>
                            </div>
                            {showBadge && (
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neon-cyan text-[10px] font-bold text-black shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                                    {pendingCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-white/5 p-4">
                <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="font-medium">{isLoggingOut ? 'Saliendo...' : 'Salir'}</span>
                </button>
            </div>
        </aside>
    );
}
