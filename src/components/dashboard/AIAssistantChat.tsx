'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Bot,
  ChevronDown,
  ChevronUp,
  FileText,
  Lightbulb,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  X,
  Calendar,
  DollarSign,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SuggestedAction {
  id: string;
  label: string;
  description: string;
  icon: 'draft' | 'schedule' | 'analyze' | 'search' | 'calculate';
  action: string;
}

export interface AIAssistantChatProps {
  initialMessages?: ChatMessage[];
  suggestedActions?: SuggestedAction[];
  className?: string;
  isFloating?: boolean;
}

const actionIcons = {
  draft: FileText,
  schedule: Calendar,
  analyze: Lightbulb,
  search: Search,
  calculate: DollarSign,
};

/**
 * Chat Message Component
 */
function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'bg-primary-600 text-white'
            : 'bg-secondary-100 text-secondary-900'
        )}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <p
          className={cn(
            'mt-1 text-xs',
            isUser ? 'text-primary-200' : 'text-secondary-400'
          )}
        >
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

/**
 * Suggested Action Button
 */
function SuggestedActionButton({
  action,
  onSelect,
}: {
  action: SuggestedAction;
  onSelect: (action: SuggestedAction) => void;
}) {
  const Icon = actionIcons[action.icon];

  return (
    <button
      onClick={() => onSelect(action)}
      className="flex items-center gap-3 rounded-xl border border-secondary-200 bg-white p-3 text-left transition-all hover:border-primary-300 hover:shadow-elevation-1"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-secondary-900">{action.label}</p>
        <p className="text-xs text-secondary-500">{action.description}</p>
      </div>
    </button>
  );
}

/**
 * AI Assistant Chat Component
 *
 * Floating or embedded chat interface for the EASE AI Assistant
 */
export function AIAssistantChat({
  initialMessages = [],
  suggestedActions = [],
  className,
  isFloating = true,
}: AIAssistantChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getAIResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSuggestedAction = (action: SuggestedAction) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: action.action,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: getActionResponse(action.id),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  // Floating chat window
  if (isFloating) {
    return (
      <>
        {/* Chat Window */}
        {isOpen && (
          <div
            className={cn(
              'fixed bottom-24 right-6 z-50 flex w-96 flex-col overflow-hidden rounded-2xl border border-secondary-200 bg-white shadow-elevation-4',
              isMinimized ? 'h-14' : 'h-[32rem]',
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-secondary-100 bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">EASE AI Assistant</h3>
                  {!isMinimized && (
                    <p className="text-xs text-primary-200">Always here to help</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  {isMinimized ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                          <Bot className="h-6 w-6 text-primary-600" />
                        </div>
                        <h4 className="mt-3 font-semibold text-secondary-900">
                          How can I help you today?
                        </h4>
                        <p className="mt-1 text-sm text-secondary-500">
                          Ask me anything about your transaction
                        </p>
                      </div>

                      {/* Suggested Actions */}
                      {suggestedActions.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-secondary-400">
                            SUGGESTED ACTIONS
                          </p>
                          {suggestedActions.map((action) => (
                            <SuggestedActionButton
                              key={action.id}
                              action={action}
                              onSelect={handleSuggestedAction}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    messages.map((message) => (
                      <ChatMessageBubble key={message.id} message={message} />
                    ))
                  )}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="rounded-2xl bg-secondary-100 px-4 py-3">
                        <div className="flex gap-1">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-secondary-400" />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-secondary-400"
                            style={{ animationDelay: '0.1s' }}
                          />
                          <span
                            className="h-2 w-2 animate-bounce rounded-full bg-secondary-400"
                            style={{ animationDelay: '0.2s' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-secondary-100 p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 rounded-xl border border-secondary-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim()}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:bg-secondary-200 disabled:text-secondary-400"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl',
            isOpen && 'rotate-0'
          )}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
        </button>
      </>
    );
  }

  // Embedded chat (non-floating)
  return (
    <div
      className={cn(
        'flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-secondary-100 bg-white',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-secondary-100 bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-white">EASE AI Assistant</h3>
          <p className="text-xs text-primary-200">Always here to help</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                <Bot className="h-6 w-6 text-primary-600" />
              </div>
              <h4 className="mt-3 font-semibold text-secondary-900">
                How can I help you today?
              </h4>
              <p className="mt-1 text-sm text-secondary-500">
                Ask me anything about your transaction
              </p>
            </div>

            {/* Suggested Actions */}
            {suggestedActions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-secondary-400">SUGGESTED ACTIONS</p>
                {suggestedActions.map((action) => (
                  <SuggestedActionButton
                    key={action.id}
                    action={action}
                    onSelect={handleSuggestedAction}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => <ChatMessageBubble key={message.id} message={message} />)
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="rounded-2xl bg-secondary-100 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-secondary-400" />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-secondary-400"
                  style={{ animationDelay: '0.1s' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-secondary-400"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-secondary-100 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 rounded-xl border border-secondary-200 px-4 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white transition-colors hover:bg-primary-700 disabled:bg-secondary-200 disabled:text-secondary-400"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Mock AI responses
function getAIResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes('inspection')) {
    return "Your home inspection is scheduled for January 18th at 2:00 PM. The inspector is John Smith from HomeCheck Pro. I'll send you a reminder the day before. Would you like me to prepare a list of questions to ask during the inspection?";
  }

  if (lowerMessage.includes('offer') || lowerMessage.includes('price')) {
    return 'Based on my analysis of comparable sales in the area, the listing price of $899,000 is competitive. Similar condos have sold for $875,000-$920,000 in the past 3 months. I can help you draft an offer - would you like me to suggest a starting price?';
  }

  if (lowerMessage.includes('closing') || lowerMessage.includes('cost')) {
    return 'Your estimated closing costs are $32,847, which includes the Toronto Double Land Transfer Tax of $28,475. As a first-time buyer, you could save up to $8,475 in rebates. Would you like me to break down all the costs?';
  }

  if (lowerMessage.includes('timeline') || lowerMessage.includes('when')) {
    return "Based on your current progress, you're on track for a closing date of February 28th. The next milestone is the inspection on January 18th, followed by the financing condition deadline on January 25th.";
  }

  return "I understand you're asking about your transaction. I can help you with offer drafting, cost analysis, scheduling, document review, and answering questions about the process. What specific aspect would you like to explore?";
}

function getActionResponse(actionId: string): string {
  switch (actionId) {
    case 'draft-offer':
      return "I'll help you draft an offer for 123 Queen St W. Based on market analysis, I suggest starting at $885,000 with a 5-day inspection condition. This gives you negotiating room while remaining competitive. Should I prepare the full offer document?";
    case 'schedule-viewing':
      return "I can schedule a viewing for you. The property is available this Saturday (Jan 15) at 11 AM or 3 PM, and Sunday at 2 PM. The listing agent is Sarah Chen. Which time works best for you?";
    case 'analyze-costs':
      return 'Here\'s your full cost breakdown for 123 Queen St W:\n\n• Purchase Price: $899,000\n• Down Payment (20%): $179,800\n• Toronto Double LTT: $28,475\n• Legal Fees: $1,800\n• Title Insurance: $450\n• Home Inspection: $500\n\nTotal Cash Needed: $210,525\n\nWould you like me to explain any of these costs?';
    default:
      return "I'm ready to help you with that. What specific information do you need?";
  }
}
