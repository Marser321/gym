"use client";

import { LayoutDashboard, Users, CreditCard, Dumbbell, Settings, LogOut, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSidebar({ pendingCount = 0 }: { pendingCount?: number }) {
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

    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
        { icon: Users, label: "Socios", href: "/admin/members" },
        { icon: UserPlus, label: "Solicitudes", href: "/admin/applications" },
        { icon: CreditCard, label: "Pagos", href: "/admin/finance" },
        { icon: Dumbbell, label: "Servicios", href: "/admin/services" },
        { icon: Settings, label: "Configuración", href: "/admin/settings" },
    ];

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
