import { CrowdIndicator } from "@/components/layout/CrowdIndicator";
import { MobileNav } from "@/components/layout/MobileNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="flex min-h-screen flex-col bg-background pb-20 md:pb-0">
            {/* Mobile Top Bar */}
            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-background/80 px-4 backdrop-blur-md md:hidden">
                <span className="text-xl font-bold tracking-tight text-white drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                    GYM <span className="text-neon-cyan">PREMIUM</span>
                </span>
                <CrowdIndicator />
            </header>

            <main className="flex-1 p-4 md:p-8">
                {children}
            </main>

            <MobileNav />
        </div>
    );
}
