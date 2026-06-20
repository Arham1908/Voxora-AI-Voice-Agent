import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4 sm:px-6 overflow-hidden">
      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <div className="mb-4 sm:mb-6 inline-flex animate-fade-in items-center rounded-full bg-sage-50 px-3 py-1 text-xs sm:text-sm font-medium text-sage-600 ring-1 ring-inset ring-sage-500/20">
          <span className="flex h-2 w-2 mr-2 rounded-full bg-sage-500"></span>
          Revolutionizing Voice Interactions
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-accent">
          Meet <span className="text-sage-500">Voxora</span> AI, your Intelligent Assistant.
        </h1>

        <p className="mt-5 sm:mt-8 text-base sm:text-lg leading-7 sm:leading-8 text-sage-600">
          An AI-powered voice agent that handles orders, management, and more with human-like precision. Experience Voxora AI.
        </p>

        <div className="mt-8 sm:mt-12 flex flex-col items-center justify-center gap-4 sm:gap-6 sm:flex-row">
          <Link
            href="/agent"
            className="sage-gradient flex h-12 sm:h-14 w-full items-center justify-center rounded-2xl px-8 sm:px-10 text-base sm:text-lg font-semibold text-white shadow-xl transition-all hover:scale-105 hover:shadow-sage-200 sm:w-auto"
          >
            Start Talking
          </Link>
          <Link
            href="/dashboard"
            className="glass flex h-12 sm:h-14 w-full items-center justify-center rounded-2xl px-8 sm:px-10 text-base sm:text-lg font-semibold text-sage-700 transition-all hover:bg-white sm:w-auto"
          >
            Open Dashboard
          </Link>
        </div>
      </div>

      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 -left-20 h-64 sm:h-96 w-64 sm:w-96 rounded-full bg-sage-200/30 blur-[120px]"></div>
      <div className="absolute bottom-0 -right-20 h-64 sm:h-96 w-64 sm:w-96 rounded-full bg-accent/20 blur-[120px]"></div>
    </div>
  );
}
