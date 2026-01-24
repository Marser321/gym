"use client";

import Link from "next/link";
import Image from "next/image";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { ArrowRight, Play, CheckCircle, X } from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { useRef, useState } from "react";

export default function Home() {
  const [showVideo, setShowVideo] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div className="bg-black min-h-screen text-white overflow-x-hidden selection:bg-neon-cyan/30">
      {/* HER0 SECTION */}
      <div ref={containerRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <motion.div
          style={{ y, opacity }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-deep-charcoal/70 backdrop-blur-[2px] z-10" />
          <Image
            src="/gym-background-dark.png"
            alt="Gym Background"
            fill
            priority
            className="object-cover object-center"
            quality={90}
          />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-20 container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <div className="mb-8 inline-flex items-center rounded-full border border-neon-cyan/30 bg-black/50 px-4 py-1.5 text-sm font-medium text-neon-cyan backdrop-blur-md shadow-[0_0_20px_rgba(0,243,255,0.2)]">
              <span className="mr-2 flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
              </span>
              SISTEMA DE ÉLITE REINVENTADO 2026
            </div>

            <h1 className="mb-6 text-5xl font-black tracking-tighter sm:text-7xl lg:text-9xl text-white drop-shadow-2xl">
              TU CUERPO <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-blue-500 to-purple-600 animate-pulse">
                TU TEMPLO
              </span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-300 md:text-xl leading-relaxed">
              No es solo sudor. Es ciencia, comunidad y tecnología aplicada a tu rendimiento.
              Únete al único gimnasio con inteligencia artificial adaptativa.
            </p>

            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/login">
                <CrystalButton size="lg" className="group text-lg px-10 py-7 shadow-[0_0_40px_rgba(0,243,255,0.3)] hover:shadow-[0_0_60px_rgba(0,243,255,0.5)]">
                  COMENZAR AHORA
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </CrystalButton>
              </Link>

              <button
                onClick={() => setShowVideo(true)}
                className="group flex items-center gap-3 px-8 py-4 text-gray-300 hover:text-white transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20 group-hover:bg-white/20 transition-all">
                  <Play className="h-5 w-5 fill-current ml-1" />
                </div>
                <span className="font-semibold tracking-wide">VER SHOWREEL</span>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 text-gray-500"
        >
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
            <div className="h-12 w-[1px] bg-gradient-to-b from-transparent via-neon-cyan to-transparent opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* FEATURES */}
      <FeaturesSection />

      {/* CTA / PRICING TEASER */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-neon-cyan/10 to-transparent z-0 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-deep-charcoal to-black p-8 md:p-16 text-center relative overflow-hidden">
            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-neon-cyan/20 blur-[120px] rounded-full pointer-events-none" />

            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
              ¿Listo para tu evolución?
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto mb-10 text-lg relative z-10">
              Nexus AI te espera. Únete hoy para acceder a la planificación biométrica avanzada y elevar tu rendimiento al máximo nivel.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-6 relative z-10">
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="h-5 w-5 text-neon-cyan" />
                <span>Entrenamiento Inteligente</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <CheckCircle className="h-5 w-5 text-neon-cyan" />
                <span>Resultados Medibles</span>
              </div>
            </div>

            <div className="mt-10 relative z-10">
              <Link href="/signup">
                <CrystalButton className="w-full sm:w-auto px-12">
                  SOLICITAR MEMBRESÍA
                </CrystalButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Simple */}
      <footer className="border-t border-white/5 bg-black py-12 text-center">
        <p className="text-gray-600 text-sm">
          © 2026 GYM PREMIUM FITNESS. Powered by <span className="text-neon-cyan">Nexus AI</span>.
        </p>
      </footer>
      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4"
            onClick={() => setShowVideo(false)}
          >
            <div className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-white/20 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/p9zCADx_g4w?autoplay=1"
                title="Gym Premium Showreel"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
