'use client'

import * as React from 'react'
import Textarea from 'react-textarea-autosize'
import { useActions, useUIState } from 'ai/rsc'
import { UserMessage } from './stocks/message'
import { type AI } from '@/lib/chat/actions'
import { Button } from '@/components/ui/button'
import { IconArrowElbow, IconPlus } from '@/components/ui/icons'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { useEnterSubmit } from '@/lib/hooks/use-enter-submit'
import { nanoid } from 'nanoid'
import { useRouter } from 'next/navigation'
import { ModelInfo } from '@/lib/types'
import { toast } from 'sonner'
import { verifyToken } from '@/lib/kamiwazaApi'

interface PromptFormProps {
  input: string
  setInput: (value: string) => void
  selectedModel: ModelInfo | null
  chatId?: string
  onSubmit?: (value: string) => Promise<void>
  isLoading?: boolean
}

export function PromptForm({
  input,
  setInput,
  selectedModel,
  chatId,
  onSubmit,
  isLoading
}: PromptFormProps) {
  const router = useRouter()
  const { formRef, onKeyDown } = useEnterSubmit()
  const inputRef = React.useRef<HTMLTextAreaElement>(null)
  const { submitUserMessage } = useActions()
  const [_, setMessages] = useUIState<typeof AI>()

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedModel) {
      toast.error('Please select a model before sending a message.')
      return
    }

    // Blur focus on mobile
    if (window.innerWidth < 600) {
      inputRef.current?.blur()
    }

    const value = input.trim()
    setInput('')
    if (!value) return

    // Generate an ID if we don't have one
    const currentId = chatId || nanoid()
    
    // Get current user data
    const userData = await verifyToken()
    console.log('handleSubmit: UserData:', userData)  // Debug user data

    // Update URL if needed
    if (!chatId) {
      await router.push(`/chat/${currentId}`)
      // Small delay to ensure URL updates
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    // Optimistically add user message UI
    setMessages(currentMessages => [
      ...currentMessages,
      {
        id: nanoid(),
        display: <UserMessage>{value}</UserMessage>
      }
    ])

    try {
      // Submit and get response message
      const responseMessage = await submitUserMessage({
        message: value,
        chatId: currentId,
        baseUrl: selectedModel.baseUrl,
        modelName: selectedModel.modelName,
        userId: userData?.id || 'anonymous'  // Add userId here
      })
      setMessages(currentMessages => [...currentMessages, responseMessage])
    } catch (error) {
      console.error('Error submitting message:', error)
      toast.error('Failed to send message. Please try again.')
    }
  }

  console.log('PromptForm render, selectedModel:', selectedModel);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="w-full">
      <div className="relative flex w-full items-center rounded-md">
        <button
          type="button"
          className="p-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.push('/new')}
        >
          <IconPlus className="h-5 w-5" />
          <span className="sr-only">New Chat</span>
        </button>
        
        <Textarea
          ref={inputRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          placeholder={isLoading ? "Loading model..." : "Send a message..."}
          className="min-h-[44px] w-full resize-none bg-transparent px-2 py-[10px] focus-within:outline-none text-sm"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          name="message"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={input === '' || isLoading}
          className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <IconArrowElbow className="h-5 w-5" />
          <span className="sr-only">Send message</span>
        </button>
      </div>
    </form>
  )
}
