'use client'

import { Send, Loader2, Square } from 'lucide-react'

interface ChatInputProps {
  input: string
  setInput: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  isStreaming: boolean
  onStopStreaming: () => void
}

export default function ChatInput({ 
  input, 
  setInput, 
  onSubmit, 
  isLoading, 
  isStreaming,
  onStopStreaming 
}: ChatInputProps) {
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSubmit(e as any)
    }
  }

  return (
    <form onSubmit={onSubmit} className="p-3 sm:p-4 border-t border-gray-100 bg-white">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me about any California judge..."
            className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
            rows={1}
            disabled={isLoading}
            style={{ 
              minHeight: '48px',
              maxHeight: '120px',
              overflowY: 'auto'
            }}
          />
          <div className="absolute right-2 bottom-2 text-xs text-gray-400">
            {input.length > 0 && `${input.length}/500`}
          </div>
        </div>
        
        {isStreaming ? (
          <button
            type="button"
            onClick={onStopStreaming}
            className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center"
            title="Stop generating"
          >
            <Square className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center min-w-[52px]"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      
      <p className="text-xs text-gray-500 mt-2 text-center">
        Press Enter to send • Shift+Enter for new line
      </p>
    </form>
  )
}