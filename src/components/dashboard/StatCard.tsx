"use client";

import { ReactNode } from "react";
import { CrystalCard } from "../crystal/CrystalCard";
import { cn } from "@/lib/utils";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: ReactNode;
    trend?: string;
    trendUp?: boolean;
    className?: string;
}

export function StatCard({ title, value, icon, trend, trendUp, className }: StatCardProps) {
    return (
        <CrystalCard className={cn("flex flex-col gap-1", className)} hoverEffect>
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 border border-white/10">
                    {icon}
                </div>
            </div>

            <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
                {trend && (
                    <span className={cn(
                        "text-xs font-medium px-1.5 py-0.5 rounded-full border",
                        trendUp
                            ? "text-green-400 bg-green-500/10 border-green-500/20"
                            : "text-red-400 bg-red-500/10 border-red-500/20"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
        </CrystalCard>
    );
}
