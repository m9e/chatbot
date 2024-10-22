import { Separator } from '@/components/ui/separator'
import { UIState } from '@/lib/chat/actions'
import { Session, ModelInfo } from '@/lib/types'
import Link from 'next/link'
import { ExclamationTriangleIcon } from '@radix-ui/react-icons'
import { ChatMessage } from '@/components/chat-message'
import React from 'react'
import { UserData } from '@/lib/kamiwazaApi'

export interface ChatList {
  messages: UIState
  user: UserData | null
  isShared: boolean
  selectedModel: ModelInfo | null
}

export function ChatList({ messages, user, isShared, selectedModel }: ChatList) {
  if (!messages.length) {
    return null
  }

  return (
    <div className="relative mx-auto max-w-2xl px-4">
      {!isShared && !user ? (
        <>
          <div className="group relative mb-4 flex items-start md:-ml-12">
            <div className="bg-background flex size-[25px] shrink-0 select-none items-center justify-center rounded-md border shadow-sm">
              <ExclamationTriangleIcon />
            </div>
            <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
              <p className="text-muted-foreground leading-normal">
                Please{' '}
                <Link href="/login" className="underline">
                  log in
                </Link>{' '}
                to save and revisit your chat history!
              </p>
            </div>
          </div>
          <Separator className="my-4" />
        </>
      ) : null}
      {messages.map((message, index) => (
        <div key={message.id}>
          {message.display ? (
            React.isValidElement(message.display) ? (
              React.cloneElement(message.display, { ...message.display.props, selectedModel })
            ) : (
              message.display
            )
          ) : (
            <ChatMessage message={message as Message} selectedModel={selectedModel} />
          )}
          {index < messages.length - 1 && <Separator className="my-4" />}
        </div>
      ))}
    </div>
  )
}