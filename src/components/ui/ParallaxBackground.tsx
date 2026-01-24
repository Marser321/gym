"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ParallaxBackgroundProps {
    className?: string;
    imageUrl?: string;
    opacity?: number;
}

export function ParallaxBackground({
    className,
    imageUrl = "/gym-background-dark.png", // Fallback/Default
    opacity = 0.2
}: ParallaxBackgroundProps) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
    const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.1, 1]);

    return (
        <div ref={ref} className={cn("absolute inset-0 overflow-hidden pointer-events-none z-0", className)}>
            <div className={`absolute inset-0 bg-black z-10`} style={{ opacity: 1 - opacity }} />
            <motion.div
                style={{ y, scale }}
                className="relative w-full h-[140%] -top-[20%]"
            >
                {imageUrl && (
                    <Image
                        src={imageUrl}
                        alt="Background"
                        fill
                        className="object-cover"
                        priority={false}
                    />
                )}
                {/* Overlay gradient for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
            </motion.div>
        </div>
    );
}
