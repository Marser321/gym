import Link from "next/link";
import { CrystalButton } from "@/components/crystal/CrystalButton";
import { ArrowRight, Play } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background font-sans text-white">
      {/* Background Video/Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-deep-charcoal/80 backdrop-blur-sm z-10" />
        <div
          className="h-full w-full bg-[url('https://images.unsplash.com/photo-1540497077202-7c8a33801f0a?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center"
        />
      </div>

      {/* Content */}
      <div className="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 text-center">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-sm font-medium text-neon-cyan backdrop-blur-md">
          <span className="mr-2 flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
          </span>
          Nueva App Disponible v2.0
        </div>

        <h1 className="mb-6 max-w-4xl text-5xl font-extrabold tracking-tight md:text-7xl lg:text-8xl text-glow">
          TU MEJOR VERSIÓN <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-blue-600">
            EMPIEZA AQUÍ
          </span>
        </h1>

        <p className="mb-10 max-w-2xl text-lg text-gray-300 md:text-xl">
          Entrena como un profesional con nuestra plataforma premium. Rutinas personalizadas, seguimiento en tiempo real y comunidad de élite.
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/login">
            <CrystalButton size="lg" className="group text-lg px-8 py-6">
              Ingresar Ahora
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </CrystalButton>
          </Link>

          <button className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20">
            <Play className="h-5 w-5 fill-current" />
            Ver Demo
          </button>
        </div>
      </div>
    </div>
  );
}
