'use client'

import { Search, MapPin, Scale, Users } from 'lucide-react'

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void
}

export default function SuggestedPrompts({ onSelectPrompt }: SuggestedPromptsProps) {
  const prompts = [
    {
      icon: Search,
      text: "Search for a judge by name",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: MapPin,
      text: "Find judges in your area",
      color: "from-purple-500 to-purple-600"
    }
  ]

  return (
    <div className="px-4 py-3 border-t border-gray-100">
      <div className="flex gap-2">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onSelectPrompt(prompt.text)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200"
          >
            <prompt.icon className="w-4 h-4 text-gray-600" />
            <span className="text-gray-700">
              {prompt.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}