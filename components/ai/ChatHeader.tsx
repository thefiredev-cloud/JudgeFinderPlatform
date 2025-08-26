'use client'

import { Sparkles } from 'lucide-react'

export default function ChatHeader() {
  return (
    <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
      <div className="flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-white" />
        <div className="flex-1">
          <h3 className="font-semibold text-white">AI Legal Assistant</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-xs text-white/80">Live</span>
        </div>
      </div>
    </div>
  )
}