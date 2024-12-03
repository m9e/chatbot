'use client'

import { cn } from '@/lib/utils'
import { ChatList } from '@/components/chat-list'
import { ChatPanel } from '@/components/chat-panel'
import { EmptyScreen } from '@/components/empty-screen'
import { ModelSelector } from '@/components/model-selector'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useEffect, useState, useCallback } from 'react'
import { useUIState, useAIState } from 'ai/rsc'
import { Message, ModelInfo } from '@/lib/types'
import { usePathname, useRouter } from 'next/navigation'
import { useScrollAnchor } from '@/lib/hooks/use-scroll-anchor'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'
import { AI } from '@/lib/chat/actions'

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
  const [aiState, setAIState] = useAIState()
  const [selectedModel, setSelectedModel] = useState<ModelInfo>()
  const [newChatId, setNewChatId] = useLocalStorage('newChatId', null)
  const [savedModel, setSavedModel] = useLocalStorage<ModelInfo | null>('selectedModel', null)

  // Debug logging for auth state
  useEffect(() => {
    console.log('Chat auth state:', { 
      user: user?.id, 
      loading, 
      hasMessages: messages?.length > 0 
    })
  }, [user, loading, messages])

  // Redirect to login if not authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const response = await fetch('/api/allow-anonymous')
      const { allowAnonymous } = await response.json()
      if (!allowAnonymous && !user && !loading) {
        console.log('Not authenticated, redirecting to login')
        router.push('/login')
        return
      }
    }
    checkAuth()
  }, [user, loading, router])

  useEffect(() => {
    if (user || loading) {
      if (!path.includes('chat') && messages?.length === 1 && !loading) {
        window.history.replaceState({}, '', `/chat/${id}`)
      }
    }
  }, [id, path, user, messages, loading])

  useEffect(() => {
    if (aiState.messages?.length === 2) {
      router.refresh()
    }
  }, [aiState.messages, router])

  useEffect(() => {
    setNewChatId(id as any)
  }, [id, setNewChatId])

  useEffect(() => {
    missingKeys.forEach(key => {
      toast.error(`Missing ${key} environment variable!`)
    })
  }, [missingKeys])

  const { messagesRef, scrollRef, visibilityRef, isAtBottom, scrollToBottom } =
    useScrollAnchor()

  // Model selection handler
  const handleModelSelect = useCallback((modelInfo: ModelInfo | null) => {
    if (modelInfo) {
      console.log('Setting selected model:', modelInfo)
      setSelectedModel(modelInfo)
      setSavedModel(modelInfo)
    }
  }, [setSavedModel])

  // Sync messages from AI state
  useEffect(() => {
    if (aiState.messages?.length > 0) {
      setMessages(aiState.messages.map((msg: Message) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role
      })))
    }
  }, [aiState.messages, setMessages])

  // Model state synchronization
  useEffect(() => {
    if (!selectedModel) {
      if (aiState.selectedModel) {
        setSelectedModel(aiState.selectedModel)
        setSavedModel(aiState.selectedModel)
      } else if (savedModel) {
        setSelectedModel(savedModel)
      }
    }
  }, []) // Run only once on mount

  return (
    <div
      className={cn(
        'group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px] bg-background',
        className
      )}
      ref={scrollRef}
    >
      <div className="fixed top-16 right-4 z-50 flex items-center">
        <ModelSelector onModelSelect={handleModelSelect} />
      </div>
      <div className={cn('pb-[200px] pt-4 md:pt-10 bg-background')} ref={messagesRef}>
        {messages?.length > 0 ? (
          <ChatList 
            messages={messages} 
            isShared={false} 
            user={user}
            selectedModel={selectedModel || null} 
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
        selectedModel={selectedModel || null}
        isLoading={!selectedModel}
      />
    </div>
  )
}