'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ModelSelector } from '@/components/model-selector'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useEffect, useState } from 'react'
import { useUIState, useAIState } from 'ai/rsc'
import { Message, ModelInfo } from '@/lib/types'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'



export interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[]
  id?: string
  missingKeys: string[]
}

export function Chat({ id, className, missingKeys }: ChatProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const path = usePathname()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useUIState<typeof AI>()
  const [aiState] = useAIState()
  const [selectedModel, setSelectedModel] = useState<ModelInfo | null>(null)

  const [_, setNewChatId] = useLocalStorage('newChatId', id)
  const userId = user?.id || 'anonymous'

  useEffect(() => {
    const checkAnonymous = async () => {
      const response = await fetch('/api/allow-anonymous')
      const { allowAnonymous } = await response.json()
      if (!allowAnonymous && !user && !loading) {
        router.push('/login')
      }
    }
    checkAnonymous()
  }, [user, loading, router])

  useEffect(() => {
    if (user || loading) {
      if (!path.includes('chat') && messages.length === 1 && !loading) {
        window.history.replaceState({}, '', `/chat/${id}`)
      }
    }
  }, [id, path, user, messages, loading])

  useEffect(() => {
    const messagesLength = aiState.messages?.length
    if (messagesLength === 2) {
      router.refresh()
    }
  }, [aiState.messages, router])

  useEffect(() => {
    setNewChatId(id)
  }, [id, setNewChatId])

  useEffect(() => {
    missingKeys.forEach(key => {
      toast.error(`Missing ${key} environment variable!`)
    })
  }, [missingKeys])

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  const handleModelSelect = (modelInfo: ModelInfo | null) => {
    setSelectedModel(modelInfo)
  }

  // Add this to maintain messages from aiState
  useEffect(() => {
    if (aiState.messages?.length > 0) {
      console.log('Updating messages from aiState:', aiState.messages)
      // Update UI state with messages from aiState
      setMessages(aiState.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        role: msg.role
      })))
    }
  }, [aiState.messages])

  // Add this to maintain selected model from aiState
  useEffect(() => {
    if (aiState.selectedModel && !selectedModel) {
      console.log('Setting selected model from aiState:', aiState.selectedModel)
      setSelectedModel(aiState.selectedModel)
    }
  }, [aiState.selectedModel, selectedModel])

  // Debug logs
  console.log('Chat render - messages:', messages)
  console.log('Chat render - aiState:', aiState)
  console.log('Chat render - id:', id)

  return (
    <div
      className={cn(
        'group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]',
        className
      )}
      ref={scrollRef}
    >
      <div className="fixed top-16 right-4 z-50 flex items-center">
        <ModelSelector onModelSelect={handleModelSelect} />
        {selectedModel && (
          <span className="ml-2 text-sm text-gray-500">
            Model: {selectedModel.modelName}
          </span>
        )}
      </div>
      <div className={cn('pb-[200px] pt-4 md:pt-10')} ref={messagesRef}>
        {messages?.length > 0 ? ( // Add null check and ensure length check
          <ChatList 
            messages={messages} 
            isShared={false} 
            user={user}
            selectedModel={selectedModel} 
          />
        ) : (
          <EmptyScreen />
        )}
        <div className="w-full h-px" ref={visibilityRef} />
      </div>
      <ChatPanel
        id={id!}
        input={input}
        setInput={setInput}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        selectedModel={selectedModel}
      />
    </div>
  )
}
