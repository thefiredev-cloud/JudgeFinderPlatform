'use client'

import { Search, MapPin, Scale } from 'lucide-react'

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void
}

export default function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  const prompts = [
    {
      icon: Search,
      text: "Search for Judge Thompson in Los Angeles",
      shortText: "Search judge"
    },
    {
      icon: Scale,
      text: "Show bias analysis for Judge Martinez",
      shortText: "Bias analysis"
    },
    {
      icon: MapPin,
      text: "Find judges in Orange County Superior Court",
      shortText: "Find by court"
    }
  ]

  return (
    <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Suggested queries:</p>
      <div className="grid grid-cols-2 gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt.text)}
            className="flex items-center gap-2 px-3 py-2.5 text-xs bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md text-left"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-[#2563eb]/10 to-[#1e40af]/10 dark:from-[#2563eb]/20 dark:to-[#1e40af]/20 rounded-lg flex-shrink-0">
              <prompt.icon className="w-4 h-4 text-[#2563eb] dark:text-[#3b82f6]" />
            </div>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {prompt.shortText}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}