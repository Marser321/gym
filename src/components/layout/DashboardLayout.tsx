import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ReactNode } from "react";

export function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen w-full bg-deep-charcoal text-white selection:bg-neon-cyan/30">
            {/* Background Noise Texture (Global) */}
            <div className="fixed inset-0 z-0 pointer-events-none noise-bg opacity-30" />

            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="relative z-10 flex-1 flex flex-col min-h-screen overflow-x-hidden pb-24 md:pb-8">
                <div className="w-full h-full max-w-7xl mx-auto p-4 md:p-8">
                    {children}
                </div>
            </main>

            {/* Mobile Navigation */}
            <MobileNav />
        </div>
    );
}
