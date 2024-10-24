import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      {/* add a thin border */}
      <div className="flex flex-col gap-2 rounded-lg bg-background p-8 border border-gray-300">
        <h1 className="text-lg font-semibold">
          Welcome to Kamiwaza PrivateGPT Chat!
        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mt-2 mb-4">
          WARNING: This system is for authorized users only. Unauthorized access is prohibited and may be subject to legal action. All activities are monitored and logged.
        </p>

        </h1>
        <p className="leading-normal text-muted-foreground">
          This is an open-source AI chatbot app built by Kamiwaza on top of Vercel's ai-chatbot. It leverages{' '}
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink>, the{' '}
          <ExternalLink href="https://sdk.vercel.ai">
            Vercel AI SDK
          </ExternalLink>
          , and{' '}
          <ExternalLink href="https://vercel.com/storage/kv">
            Vercel KV
          </ExternalLink>
          .
        </p>
        <p className="leading-normal text-muted-foreground">
          Powered by the{' '}
          <ExternalLink href="https://kamiwaza.ai">
            Kamiwaza Enterprise AI Platform
          </ExternalLink>
          , this chatbot demonstrates the capabilities of combining text with generative UI as output of the LLM. 
          The UI state is synced through the SDK, ensuring the model remains aware of your interactions in real-time.
        </p>
      </div>
    </div>
  )
}
