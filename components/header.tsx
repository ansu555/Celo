"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import RuleBuilderModal from "@/components/rule-builder-modal";
import { toast } from "@/hooks/use-toast";
import { ModeToggle } from "@/components/mode-toggle";
import { ConnectKitButton } from "connectkit";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useViewport } from "@/hooks/use-viewport";
import { describeRule } from "@/lib/shared/rules";
import { createRule } from "@/features/agent/api/client";

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const { isMobile } = useViewport();
  const { address } = useAccount();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const modeToggleRef = useRef<HTMLDivElement>(null);
  // Use Celo wallet address or fallback to placeholder
  const walletAddress = address || "0x0000000000000000000000000000000000000000";

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close mobile menu when clicking outside or pressing escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    }

    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Element;
      
      // Don't close if clicking inside mobile menu
      if (mobileMenuRef.current?.contains(target)) {
        return;
      }
      
      // Don't close if clicking on mode toggle or its dropdown
      if (modeToggleRef.current?.contains(target)) {
        return;
      }
      
      // Don't close if clicking on any dropdown menu content (Radix UI portals)
      if (target.closest('[role="menu"]') || 
          target.closest('[data-radix-dropdown-menu-content]') ||
          target.closest('[data-radix-popper-content-wrapper]')) {
        return;
      }
      
      setMobileMenuOpen(false);
    }

    if (mobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Explore", href: "/cryptocurrencies" },
    { name: "Trade", href: "/trade" },
    { name: "Pool", href: "/pool" },
    { name: "Stake", href: "/stake" },
    { name: "Portfolio", href: "/agent-dashboard" },
  ];

  const saveRule = async (rule: any) => {
    // Map UI schema -> API schema
    const type = rule.strategy === 'DCA' ? 'dca' : rule.strategy === 'REBALANCE' ? 'rebalance' : 'rotate'
    const payload = {
      ownerAddress: walletAddress,
      type,
      targets: Array.isArray(rule.coins) ? rule.coins : [],
      rotateTopN: rule.rotateTopN,
      maxSpendUSD: rule.maxSpendUsd,
      maxSlippage: rule.maxSlippagePercent,
      cooldownMinutes: rule.cooldownMinutes,
      // Trigger fields are mapped on the server via mapTrigger
      triggerType: rule.triggerType,
      dropPercent: rule.dropPercent,
      trendWindow: rule.trendWindow,
      trendThreshold: rule.trendThreshold,
      momentumLookback: rule.momentumLookback,
      momentumThreshold: rule.momentumThreshold,
      status: 'active',
    }

    setRules((prev) => [payload as any, ...prev])
    try {
      const json = await createRule(payload)
      setRules((prev) => [{ ...(payload as any), id: json.id }, ...prev.filter((r) => (r as any) !== (payload as any))])
    } catch (e) {
      console.error("Failed to save rule:", e)
    }
  }

  return (
  // Make header transparent so background shader is visible behind it
  <header className="sticky top-0 z-50 w-full bg-transparent text-white backdrop-blur-lg">
  <div className="container relative flex h-16 items-center justify-between px-4 md:px-8">
        {/* Logo */}
  <Link href="/" className="absolute left-8 top-1/2 transform -translate-y-1/2 z-10 flex items-center font-extrabold text-lg md:text-xl tracking-tight">
        <img 
          src="/10xswap_logo.png" 
          alt="Accorto Logo" 
          className="h-8 w-8 mr-2"
        />
        <span className="text-white">Accorto</span>
      </Link>

        {/* Desktop navigation - Centered */}
  <nav className="hidden md:flex gap-6 items-center justify-center absolute left-1/2 transform -translate-x-1/2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  // base
                  "text-sm font-medium transition-colors inline-flex items-center justify-center",
                  "px-4 py-2 rounded-full",
                  // visual
                  isActive
                    ? "bg-white/25 text-white backdrop-blur-lg shadow-sm"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

    {/* Desktop wallet connect and mode toggle (aligned to right corner) */}
  <div className="hidden md:flex items-center gap-3 text-white absolute right-8 top-1/2 transform -translate-y-1/2">
                <RuleBuilderModal
            trigger={
              <Button
                variant="ghost"
                size="default"
                className="px-6 py-2 rounded-[40px] bg-white/8 text-white border border-white/10 backdrop-blur-lg hover:bg-white/12 shadow-[0_6px_18px_rgba(0,0,0,0.25)] flex items-center gap-3"
              >
                {/* optional left icon could go here */}
                <span className="font-medium">Auto-Pilot Portfolio</span>
              </Button>
            }
            availableCoins={[
              { id: 'celo', symbol: 'CELO', name: 'Celo' },
              { id: 'celo-dollar', symbol: 'cUSD', name: 'Celo Dollar' },
              { id: 'celo-euro', symbol: 'cEUR', name: 'Celo Euro' },
            ]}
            onPreview={(rule) => {
              toast({ title: "Preview", description: describeRule(rule) })
            }}
            onSave={(rule) => {
              saveRule(rule)
              toast({ title: "Rule saved", description: describeRule(rule) })
            }}
          />
              <ConnectKitButton.Custom>
            {({ isConnected, show, truncatedAddress }) => (
              <Button onClick={show} variant="ghost" size="default" className="px-4 py-2 rounded-[32px] bg-white/6 text-white border border-white/10 backdrop-blur-lg hover:bg-white/12 shadow-sm">
                <span className="font-medium text-sm">{isConnected ? truncatedAddress : "0xA339••••1366"}</span>
              </Button>
            )}
          </ConnectKitButton.Custom>
          <div className="ml-2">
            <ModeToggle />
          </div>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="mobile-menu md:hidden border-t bg-white/95 backdrop-blur dark:bg-[#171717]/95 absolute w-full z-40">
          <div className="container py-4 space-y-4">
            <nav className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors py-2 px-2 rounded-md",
                    pathname === item.href
                      ? "text-primary dark:text-[#A3B18A] bg-primary/10 dark:bg-[#A3B18A]/10"
                      : "text-gray-700 hover:text-primary hover:bg-primary/5 dark:text-[#A3B18A]/60 dark:hover:text-[#A3B18A] dark:hover:bg-[#A3B18A]/5"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col gap-3 pt-3 border-t">
              <RuleBuilderModal
                trigger={
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="w-full group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/25 dark:hover:shadow-[#A3B18A]/25"
                  >
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-white dark:group-hover:text-black">
                      Auto-Pilot Portfolio
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 dark:from-[#A3B18A] dark:to-[#A3B18A]/80 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  </Button>
                }
                availableCoins={[
                  { id: 'celo', symbol: 'CELO', name: 'Celo' },
                  { id: 'celo-dollar', symbol: 'cUSD', name: 'Celo Dollar' },
                  { id: 'celo-euro', symbol: 'cEUR', name: 'Celo Euro' },
                ]}
                onPreview={(rule) => {
                  toast({ title: "Preview", description: describeRule(rule) })
                }}
                onSave={(rule) => {
                  saveRule(rule)
                  toast({ title: "Rule saved", description: describeRule(rule) })
                }}
              />
              <div className="w-full">
                <ConnectKitButton />
              </div>
              <div className="flex justify-center">
                <div ref={modeToggleRef} data-theme-toggle>
                  <ModeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
