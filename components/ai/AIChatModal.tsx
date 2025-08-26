'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Send, Sparkles, User, Bot, ChevronDown } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI legal assistant. I can help you find information about judges, analyze bias patterns, and guide you through the legal process. How can I assist you today?",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    // Only scroll to bottom after user interaction, not on initial mount
    if (!isInitialMount.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    } else {
      isInitialMount.current = false
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Simulate AI response (in production, this would call an API)
    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: getAIResponse(userMessage.content),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  const getAIResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase()
    
    if (lowerQuery.includes('judge') && (lowerQuery.includes('find') || lowerQuery.includes('search'))) {
      return "I can help you find judges in California. You can search by name, county, or court type. Try clicking the 'Search Judges' button in the navigation or describe what kind of judge you're looking for."
    }
    
    if (lowerQuery.includes('bias')) {
      return "Our platform uses AI to analyze judicial bias across multiple dimensions including consistency, speed, settlement preference, risk tolerance, and predictability. Each judge receives a bias score based on their historical case decisions."
    }
    
    if (lowerQuery.includes('compare')) {
      return "You can compare up to 3 judges side-by-side using our comparison tool. This helps you understand differences in their decision patterns, case handling times, and reversal rates."
    }
    
    return "I understand you're looking for legal information. Our platform provides comprehensive data on California judges, including bias analysis, case history, and court assignments. How can I help you navigate this information?"
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">AI Legal Assistant</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Advanced AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {message.role === 'user' && (
                <div className="flex-shrink-0 w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              "How do I find a judge?",
              "What is bias analysis?",
              "Compare judges in my area"
            ].map((question, index) => (
              <button
                key={index}
                onClick={() => setInput(question)}
                className="flex-shrink-0 px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-700 dark:text-gray-300"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about judges or legal processes..."
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}