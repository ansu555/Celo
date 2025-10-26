"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

// Lazy load heavier components if they exist
const MiniCryptoTable = dynamic(() => import("@/components/mini-crypto-table"), { ssr: false, loading: () => <div className="text-sm text-muted-foreground">Loading assets...</div> });

export default function HomePage() {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  return (
    <div className="flex flex-col gap-16 pb-24">
      {/* Hero */}
      <section className="relative pt-20 pb-24 px-6 md:px-10 lg:px-16 overflow-hidden">
        {/* Fixed positioned hero container pinned to viewport bottom-left */}
        <div className="fixed left-6 bottom-6 lg:left-12 lg:bottom-12 z-40 w-full max-w-md transform origin-bottom-left md:scale-150">
          <div className="text-left">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
              Accorto Intelligence Hub
            </h1>
            <p className="mt-4 text-base md:text-lg text-white/80 leading-relaxed max-w-md">
              Real-time crypto data, automated portfolio logic, and intelligent routing—all in one unified interface.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-start">
              <Link href="/agent-dashboard"><Button size="lg">Agent Dashboard</Button></Link>
              <Link href="/cryptocurrencies"><Button size="lg" variant="outline">Explore Assets</Button></Link>
            </div>
          </div>
        </div>
        {/* Spacer to preserve page height; increased on md+ to match 1.5x scale */}
        <div className="h-[420px] md:h-[630px]" aria-hidden />
      </section>

      {/* (Market Snapshot removed as requested) */}

      {/* Trending assets table removed per request */}
    </div>
  );
}
