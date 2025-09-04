'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, Bot, User, Loader2 } from 'lucide-react'
import ChatMessage from './ChatMessage'
import JudgeCard from './JudgeCard'
import SuggestedPrompts from './SuggestedPrompts'
import ChatInput from './ChatInput'
import ChatHeader from './ChatHeader'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  type?: 'text' | 'judge_card' | 'judge_list'
  judgeData?: any
  judgesData?: any[]
  timestamp: Date
}

export default function BuilderStyleChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Ask me about any California judge or court.",
      type: 'text',
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Only scroll to bottom after user interaction, not on initial mount
    if (!isInitialMount.current) {
      scrollToBottom()
    } else {
      isInitialMount.current = false
    }
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt)
    // Optionally auto-submit
    handleSubmit(new Event('submit') as any, prompt)
  }

  const handleSubmit = async (e: React.FormEvent, overrideInput?: string) => {
    e.preventDefault()
    const queryText = overrideInput || input.trim()
    
    if (!queryText || isLoading) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: queryText,
      type: 'text',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setIsStreaming(true)

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          stream: true
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ''
      const assistantMessageId = Date.now().toString()

      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        type: 'text',
        timestamp: new Date()
      }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') {
                setIsStreaming(false)
                // Check if response contains judge information
                await checkForJudgeData(accumulatedContent, assistantMessageId)
                continue
              }
              
              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  accumulatedContent += parsed.text
                  
                  // Update the assistant message with accumulated content
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  ))
                }
              } catch (e) {
                console.error('Error parsing SSE data:', e)
              }
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted')
      } else {
        console.error('Chat error:', error)
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          type: 'text',
          timestamp: new Date()
        }])
      }
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
      abortControllerRef.current = null
    }
  }

  const checkForJudgeData = async (content: string, messageId: string) => {
    // Check if the response mentions a specific judge
    const judgeNameMatch = content.match(/Judge\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g)
    
    if (judgeNameMatch && judgeNameMatch.length > 0) {
      // Search for judge data
      try {
        const judgeName = judgeNameMatch[0].replace('Judge ', '')
        const searchResponse = await fetch(`/api/judges/chat-search?name=${encodeURIComponent(judgeName)}`)
        
        if (searchResponse.ok) {
          const data = await searchResponse.json()
          
          if (data.judge) {
            // Add a judge card after the text message
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: '',
              type: 'judge_card',
              judgeData: data.judge,
              timestamp: new Date()
            }])
          } else if (data.judges && data.judges.length > 0) {
            // Add multiple judge cards
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: '',
              type: 'judge_list',
              judgesData: data.judges,
              timestamp: new Date()
            }])
          }
        }
      } catch (error) {
        console.error('Error fetching judge data:', error)
      }
    }
  }

  const stopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsStreaming(false)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col">
      {/* AI Disclaimer - Simplified */}
      <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          <span className="font-semibold">ℹ️ Note:</span> AI analysis for informational purposes only.
        </p>
      </div>
      
      {/* Suggested Prompts - Moved outside and simplified */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSuggestedPrompt("Search for Judge Thompson in Los Angeles")}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full transition-colors"
          >
            🔍 Search judge
          </button>
          <button
            onClick={() => handleSuggestedPrompt("Show bias analysis for Judge Martinez")}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full transition-colors"
          >
            📊 Bias analysis
          </button>
          <button
            onClick={() => handleSuggestedPrompt("Find judges in Orange County Superior Court")}
            className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full transition-colors"
          >
            📍 Find by court
          </button>
        </div>
      </div>
      
      <div className="flex flex-col h-[450px] sm:h-[500px] lg:h-[550px] bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <ChatHeader />

        {/* Messages Area - Increased height since prompts are outside */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 custom-scrollbar">
          {messages.map((message) => (
            <div key={message.id}>
              {message.type === 'judge_card' && message.judgeData ? (
                <JudgeCard judge={message.judgeData} />
              ) : message.type === 'judge_list' && message.judgesData ? (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 mb-2">I found multiple judges matching your query:</p>
                  {message.judgesData.slice(0, 3).map((judge, idx) => (
                    <JudgeCard key={idx} judge={judge} compact />
                  ))}
                </div>
              ) : (
                <ChatMessage message={message} />
              )}
            </div>
          ))}
          
          {isLoading && !isStreaming && (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isStreaming={isStreaming}
          onStopStreaming={stopStreaming}
        />
      </div>
    </div>
  )
}