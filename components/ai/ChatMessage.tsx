'use client'

import { Bot, User } from 'lucide-react'
import { Message } from './BuilderStyleChat'

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}
      
      <div className={`max-w-[70%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div
          className={`px-4 py-3 rounded-2xl ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-sm'
              : 'bg-gray-100 text-gray-900 rounded-bl-sm'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className={`text-xs mt-1 ${isUser ? 'text-right' : 'text-left'} text-gray-500`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center order-2">
          <User className="w-5 h-5 text-gray-600" />
        </div>
      )}
    </div>
  )
}