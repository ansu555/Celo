"use client"

import React from "react"
import { motion } from "framer-motion"
import { Bot, Compass } from "lucide-react"

interface ActionButtonsProps {
  onAgentDashboard?: () => void
  onExploreAssets?: () => void
  className?: string
}

export default function ActionButtons({ 
  onAgentDashboard, 
  onExploreAssets, 
  className = "" 
}: ActionButtonsProps) {
  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {/* Agent Dashboard Button - Solid filled style like React Bits */}
      <motion.button
        onClick={onAgentDashboard}
  className="group relative flex items-center gap-3 rounded-full bg-[#2a3a2a]/90 px-6 py-3 text-white shadow-lg backdrop-blur-md border border-white/10 hover:bg-[#2a3a2a] transition-all duration-300"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Icon */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
          <Bot className="h-4 w-4 text-white" />
        </div>
        
        {/* Text */}
        <span className="font-medium text-sm">Agent Dashboard</span>
        
        {/* Subtle glow on hover */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#F3C623]/10 to-[#D9A800]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.button>

      {/* Explore Assets Button - Outline style */}
      <motion.button
        onClick={onExploreAssets}
  className="group relative flex items-center gap-3 rounded-full border border-[#FF5CA8]/60 bg-transparent px-6 py-3 text-[#FF5CA8] backdrop-blur-md hover:border-[#FF5CA8] hover:bg-[#FF5CA8]/10 transition-all duration-300"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#FF5CA8]/60 bg-transparent group-hover:bg-[#FF5CA8]/20 transition-colors duration-300">
          <Compass className="h-4 w-4 text-[#FF5CA8]" />
        </div>
        
        {/* Text */}
        <span className="font-medium text-sm">Explore Assets</span>
        
        {/* Subtle glow on hover */}
  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF5CA8]/5 to-[#C43E82]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </motion.button>
    </div>
  )
}
