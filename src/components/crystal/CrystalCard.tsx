"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import React from "react";

import { TiltWrapper } from "./TiltWrapper";

interface CrystalCardProps extends HTMLMotionProps<"div"> {
    children: React.ReactNode;
    hoverEffect?: boolean;
    tilt?: boolean;
}

export const CrystalCard = React.forwardRef<HTMLDivElement, CrystalCardProps>(
    ({ className, children, hoverEffect = true, tilt = false, ...props }, ref) => {
        const CardContent = (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                whileHover={hoverEffect ? { scale: 1.02, backgroundColor: "rgba(15, 17, 21, 0.7)" } : {}}
                className={cn(
                    "glass-card rounded-2xl p-6 text-white transition-all duration-300",
                    "hover:shadow-[0_0_20px_rgba(0,243,255,0.1)] hover:border-neon-cyan/30",
                    className
                )}
                {...props}
            >
                {children}
            </motion.div>
        );

        if (tilt) {
            return <TiltWrapper>{CardContent}</TiltWrapper>;
        }

        return CardContent;
    }
);
CrystalCard.displayName = "CrystalCard";
