import { CalibrationFlow } from "@/components/nexus/CalibrationFlow";
import { Sparkles } from "lucide-react";

export default function NexusPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center py-8">
            <div className="text-center mb-12 space-y-2">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-neon-cyan/5 border border-neon-cyan/20 mb-4 animate-pulse">
                    <Sparkles className="h-6 w-6 text-neon-cyan" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                    NEXUS <span className="text-neon-cyan text-glow">AI</span>
                </h1>
                <p className="text-gray-500 font-mono text-sm tracking-widest">
                    SYSTEM V2.4 // CALIBRATION MODE
                </p>
            </div>

            <CalibrationFlow />
        </div>
    );
}
