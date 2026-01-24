import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LayoutDashboard, Users, CreditCard, Dumbbell, Settings, LogOut, UserPlus } from "lucide-react";
import Link from "next/link";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    if (!supabase) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-deep-charcoal p-4">
                <div className="w-full max-w-md space-y-4 rounded-3xl border border-red-500/20 bg-black/40 p-8 text-center backdrop-blur-xl">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                        <Settings className="h-6 w-6 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Error de Configuración</h2>
                    <p className="text-sm text-gray-400">No se encontraron las variables de entorno de Supabase necesarias para el panel administrativo.</p>
                </div>
            </div>
        );
    }

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const cookieStore = await cookies();
    const hasAccess = cookieStore.get("admin_access");

    if (!hasAccess) {
        redirect("/admin/login");
    }

    // Fetch pending applications count
    let pendingCount = 0;
    try {
        const { count } = await supabase
            .from('membership_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
        pendingCount = count || 0;
    } catch (e) {
        // Silently fail, just show 0 or no badge
    }


    const menuItems = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/admin/dashboard" },
        { icon: Users, label: "Socios", href: "/admin/members" },
        { icon: UserPlus, label: "Solicitudes", href: "/admin/applications" },
        { icon: CreditCard, label: "Pagos", href: "/admin/finance" },
        { icon: Dumbbell, label: "Servicios", href: "/admin/services" },
        { icon: Settings, label: "Configuración", href: "/admin/settings" },
    ];

    return (
        <div className="flex min-h-screen bg-deep-charcoal">
            {/* Sidebar Desktop - Extracted to Client Component for interactivity */}
            <AdminSidebar pendingCount={pendingCount} />

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <header className="flex h-16 items-center justify-between border-b border-white/5 bg-black/20 px-8 backdrop-blur-md">
                    <h2 className="font-semibold text-white">Panel de Control</h2>
                    <div className="flex items-center gap-4">
                        {/* Admin User info or notifications */}
                        <div className="h-8 w-8 rounded-full bg-neon-cyan/20 border border-neon-cyan/50" />
                    </div>
                </header>
                <div className="p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
