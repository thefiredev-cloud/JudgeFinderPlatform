'use client'

import { Scale } from 'lucide-react'

export default function ChatHeader() {
  return (
    <div className="px-4 py-3 bg-gradient-to-r from-[#2563eb] to-[#1e40af] text-white rounded-t-xl border-b border-blue-700/20">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
          <Scale className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-white text-sm">JudgeFinder AI Assistant</h3>
          <p className="text-xs text-blue-100/80">Powered by Advanced Legal Analytics</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-white/80 font-medium">Online</span>
        </div>
      </div>
    </div>
  )
}