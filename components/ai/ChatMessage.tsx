'use client'

import { Scale, User } from 'lucide-react'
import { Message } from './BuilderStyleChat'

interface ChatMessageProps {
  message: Message
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563eb] to-[#1e40af] shadow-sm flex items-center justify-center">
          <Scale className="w-4 h-4 text-white" />
        </div>
      )}
      
      <div className={`max-w-[70%] ${isUser ? 'order-1' : 'order-2'}`}>
        <div
          className={`px-4 py-3 rounded-xl ${
            isUser
              ? 'bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-br-md shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-md border border-slate-200 dark:border-slate-700'
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className={`text-[10px] mt-1 ${isUser ? 'text-right' : 'text-left'} text-slate-400 dark:text-slate-500`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center order-2 shadow-sm">
          <User className="w-4 h-4 text-slate-600 dark:text-slate-400" />
        </div>
      )}
    </div>
  )
}