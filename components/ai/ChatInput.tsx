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
    <form onSubmit={onSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about any judge or court..."
          className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
          rows={1}
          disabled={isLoading}
          style={{ 
            minHeight: '40px',
            maxHeight: '100px',
            overflowY: 'auto'
          }}
        />
        
        {isStreaming ? (
          <button
            type="button"
            onClick={onStopStreaming}
            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            title="Stop"
          >
            <Square className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      
      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 text-center">
        Press Enter to send • Shift+Enter for new line
      </p>
    </form>
  )
}