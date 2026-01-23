"use client";

import * as React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface CrystalButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
    variant?: "primary" | "secondary" | "ghost" | "danger";
    size?: "sm" | "md" | "lg" | "icon";
    isLoading?: boolean;
    children: React.ReactNode;
}

const CrystalButton = React.forwardRef<HTMLButtonElement, CrystalButtonProps>(
    ({ className, variant = "primary", size = "md", isLoading, children, ...props }, ref) => {

        const variants = {
            primary: "bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/50 hover:bg-neon-cyan hover:text-black hover:shadow-[0_0_20px_rgba(0,243,255,0.4)]",
            secondary: "bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20",
            ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/5",
            danger: "bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500 hover:text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs rounded-lg",
            md: "h-11 px-6 text-sm rounded-xl",
            lg: "h-14 px-8 text-base rounded-2xl",
            icon: "h-10 w-10 p-2 rounded-xl flex items-center justify-center",
        };

        return (
            <motion.button
                ref={ref}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                className={cn(
                    "relative inline-flex items-center justify-center font-medium transition-all duration-300 shadow-lg backdrop-blur-sm",
                    "disabled:opacity-50 disabled:pointer-events-none",
                    variants[variant],
                    sizes[size],
                    className
                )}
                disabled={isLoading}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!isLoading && children}

                {/* Shine effect overlay */}
                {variant === 'primary' && (
                    <div className="absolute inset-0 -z-10 overflow-hidden rounded-[inherit]">
                        <div className="absolute top-0 left-[-100%] h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 animate-shine opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                )}
            </motion.button>
        );
    }
);
CrystalButton.displayName = "CrystalButton";

export { CrystalButton };
