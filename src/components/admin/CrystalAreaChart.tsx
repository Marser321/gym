"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface DataPoint {
    label: string;
    value: number;
}

interface CrystalAreaChartProps {
    data: DataPoint[];
    color?: string; // hex color or tailwind class mostly for structure, but dealing with SVG needs explicit hex usually or currentColor
    height?: number;
}

export function CrystalAreaChart({ data, color = "#00f3ff", height = 200 }: CrystalAreaChartProps) {
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

    // Normalize data for SVG
    const maxValue = Math.max(...data.map(d => d.value));
    const minValue = Math.min(...data.map(d => d.value));
    const range = maxValue - minValue || 1; // avoid division by zero

    const points = data.map((d, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((d.value - minValue) / range) * 80 - 10; // keep 10% padding top/bottom
        return { x, y, value: d.value, label: d.label };
    });

    const pathD = `M0,100 ` + points.map(p => `L${p.x},${p.y}`).join(" ") + ` L100,100 Z`;
    const lineD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(" ");

    return (
        <div className="relative w-full select-none" style={{ height: `${height}px` }}>
            {/* Chart SVG */}
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={color} stopOpacity="0.0" />
                    </linearGradient>
                </defs>

                {/* Area Fill */}
                <motion.path
                    initial={{ d: `M0,100 L100,100 L100,100 Z` }}
                    animate={{ d: pathD }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    fill="url(#chartGradient)"
                />

                {/* Line Stroke */}
                <motion.path
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    d={lineD}
                    fill="none"
                    stroke={color}
                    strokeWidth="0.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {points.map((p, i) => (
                    <g key={i}>
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r="1.5"
                            fill={color}
                            className="opacity-0 hover:opacity-100 transition-opacity cursor-crosshair"
                            onMouseEnter={() => setHoveredPoint(i)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                        <circle
                            cx={p.x}
                            cy={p.y}
                            r="6"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(i)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                    </g>
                ))}
            </svg>

            {/* Tooltip Overlay */}
            {hoveredPoint !== null && (
                <div
                    className="absolute -top-10 transform -translate-x-1/2 pointer-events-none"
                    style={{ left: `${points[hoveredPoint].x}%` }}
                >
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg text-xs"
                    >
                        <div className="font-bold text-white">{points[hoveredPoint].value}</div>
                        <div className="text-[10px] text-gray-400">{points[hoveredPoint].label}</div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
