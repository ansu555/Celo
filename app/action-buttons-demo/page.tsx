"use client"

import React from "react"
import ActionButtons from "@/components/action-buttons"

export default function ActionButtonsDemo() {
  const handleAgentDashboard = () => {
    console.log("Agent Dashboard clicked")
    // Add your navigation logic here
  }

  const handleExploreAssets = () => {
    console.log("Explore Assets clicked")
    // Add your navigation logic here
  }

  return (
    <div className="min-h-screen bg-black p-8">
      {/* Background with grid pattern similar to React Bits */}
      <div className="absolute inset-0 bg-black">
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23F3C623" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30" />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Action Buttons Demo</h1>
          <p className="text-gray-400">React Bits inspired button styling</p>
        </div>

        {/* Button Examples */}
        <div className="space-y-8">
          {/* Default styling */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Default Styling</h2>
            <ActionButtons 
              onAgentDashboard={handleAgentDashboard}
              onExploreAssets={handleExploreAssets}
            />
          </div>

          {/* Centered */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Centered</h2>
            <div className="flex justify-center">
              <ActionButtons 
                onAgentDashboard={handleAgentDashboard}
                onExploreAssets={handleExploreAssets}
              />
            </div>
          </div>

          {/* Right aligned */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Right Aligned</h2>
            <div className="flex justify-end">
              <ActionButtons 
                onAgentDashboard={handleAgentDashboard}
                onExploreAssets={handleExploreAssets}
              />
            </div>
          </div>

          {/* With custom spacing */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Custom Spacing</h2>
            <ActionButtons 
              onAgentDashboard={handleAgentDashboard}
              onExploreAssets={handleExploreAssets}
              className="gap-8"
            />
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 p-6 bg-[#2a3a2a]/50 rounded-lg border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-3">Usage</h3>
          <div className="text-gray-300 space-y-2">
            <p>• Import: <code className="bg-black/50 px-2 py-1 rounded text-[#F3C623]">import ActionButtons from "@/components/action-buttons"</code></p>
            <p>• Use: <code className="bg-black/50 px-2 py-1 rounded text-[#F3C623]">&lt;ActionButtons onAgentDashboard={...} onExploreAssets={...} /&gt;</code></p>
            <p>• Props: <code className="bg-black/50 px-2 py-1 rounded text-[#F3C623]">onAgentDashboard</code>, <code className="bg-black/50 px-2 py-1 rounded text-[#F3C623]">onExploreAssets</code>, <code className="bg-black/50 px-2 py-1 rounded text-[#F3C623]">className</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}

