import React from 'react'

import { cn } from '@/lib/utils'
import { ExternalLink } from '@/components/external-link'

export function FooterText({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      className={cn(
        'px-2 text-center text-xs leading-normal text-muted-foreground/50 bg-background',
        className
      )}
      {...props}
    >
      Built with{' '}
      <ExternalLink href="https://nextjs.org">Next.js</ExternalLink>{' '}
      and{' '}
      <ExternalLink href="https://github.com/vercel/ai">Vercel AI</ExternalLink>{' '}
      · Powered by{' '}
      <ExternalLink href="https://kamiwaza.ai">Kamiwaza</ExternalLink>
    </p>
  )
}
