'use client'

import { useChat, type UIMessage } from '@ai-sdk/react'
import { TextStreamChatTransport } from 'ai'
import { useState, useMemo } from 'react'

interface ChatPanelProps {
  transactionId?: string
  transactionStatus?: string
  mlsNumber?: string
  coordinatorEmail?: string
}

const LEGAL_REFUSAL_SIGNAL = "can't provide legal advice"

/** Extract plain text from a UIMessage parts array (AI SDK v6 structure) */
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

export function ChatPanel({
  transactionStatus,
  mlsNumber,
  coordinatorEmail,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')

  // AI SDK v6: use TextStreamChatTransport with custom API URL
  const transport = useMemo(
    () =>
      new TextStreamChatTransport({
        api: '/api/ai/chat',
        body: { context: { transactionStatus, mlsNumber, coordinatorEmail } },
      }),
    [transactionStatus, mlsNumber, coordinatorEmail]
  )

  const { messages, sendMessage, status, error } = useChat({ transport })

  const isLoading = status === 'submitted' || status === 'streaming'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || isLoading) return
    setInputValue('')
    sendMessage({ text: trimmed })
  }

  return (
    <div className="flex flex-col h-full min-h-96 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">AI Assistant</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Ask about your transaction, documents, or the offer process. For legal questions, your coordinator is your best resource.
        </p>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">
            Ask me anything about your transaction.
          </p>
        )}

        {messages.map((message: UIMessage) => {
          const textContent = getMessageText(message)
          const isLegalRefusal =
            message.role === 'assistant' &&
            textContent.toLowerCase().includes(LEGAL_REFUSAL_SIGNAL)

          return (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : isLegalRefusal
                    ? 'bg-amber-50 border border-amber-200 text-amber-900'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {isLegalRefusal && (
                  <p className="font-semibold text-amber-800 mb-1 text-xs uppercase tracking-wide">
                    Legal question — redirecting
                  </p>
                )}
                <p className="whitespace-pre-wrap">{textContent}</p>
              </div>
            </div>
          )
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-red-800 text-sm">Something went wrong. Please try again.</p>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your transaction..."
            disabled={isLoading}
            className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}
