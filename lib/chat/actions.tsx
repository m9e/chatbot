import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { createOpenAI } from '@ai-sdk/openai'

import {
  spinner,
  BotCard,
  BotMessage,
  SystemMessage,
  Stock,
  Purchase
} from '@/components/stocks'

import { z } from 'zod'
import { EventsSkeleton } from '@/components/stocks/events-skeleton'
import { Events } from '@/components/stocks/events'
import { StocksSkeleton } from '@/components/stocks/stocks-skeleton'
import { Stocks } from '@/components/stocks/stocks'
import { StockSkeleton } from '@/components/stocks/stock-skeleton'
import {
  formatNumber,
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message, ModelInfo } from '@/lib/types'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/kamiwazaApi'

async function confirmPurchase(symbol: string, price: number, amount: number) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  const purchasing = createStreamableUI(
    <div className="inline-flex items-start gap-1 md:items-center">
      {spinner}
      <p className="mb-2">
        Purchasing {amount} ${symbol}...
      </p>
    </div>
  )

  const systemMessage = createStreamableUI(null)

  runAsyncFnWithoutBlocking(async () => {
    await sleep(1000)

    purchasing.update(
      <div className="inline-flex items-start gap-1 md:items-center">
        {spinner}
        <p className="mb-2">
          Purchasing {amount} ${symbol}... working on it...
        </p>
      </div>
    )

    await sleep(1000)

    purchasing.done(
      <div>
        <p className="mb-2">
          You have successfully purchased {amount} ${symbol}. Total cost:{' '}
          {formatNumber(amount * price)}
        </p>
      </div>
    )

    systemMessage.done(
      <SystemMessage>
        You have purchased {amount} shares of {symbol} at ${price}. Total cost ={' '}
        {formatNumber(amount * price)}.
      </SystemMessage>
    )

    aiState.done({
      ...aiState.get(),
      messages: [
        ...aiState.get().messages,
        {
          id: nanoid(),
          role: 'system',
          content: `[User has purchased ${amount} shares of ${symbol} at ${price}. Total cost = ${
            amount * price
          }]`
        }
      ]
    })
  })

  return {
    purchasingUI: purchasing.value,
    newMessage: {
      id: nanoid(),
      display: systemMessage.value
    }
  }
}

async function selectModel(baseUrl: string, modelName: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()
  
  aiState.update({
    ...aiState.get(),
    selectedModel: { baseUrl, modelName }
  })

  return { success: true }
}

async function submitUserMessage({ message, baseUrl, modelName }: {
  message: string,
  baseUrl: string,
  modelName: string
}) {
  'use server'

  console.log(`Submitting message with baseUrl: ${baseUrl}, modelName: ${modelName}`);

  const aiState = getMutableAIState<typeof AI>()
  const currentState = aiState.get()

  aiState.update({
    ...currentState,
    messages: [
      ...currentState.messages,
      {
        id: nanoid(),
        role: 'user',
        content: message
      }
    ],
    selectedModel: { baseUrl, modelName }
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const openai = createOpenAI({
    baseURL: baseUrl,
    apiKey: 'kamiwaza_model'
  });

  console.log(`Created OpenAI client with baseURL: ${baseUrl}`);

  const result = await streamUI({
    model: openai(modelName),
    initial: <SpinnerMessage />,
    system: `You are a helpful AI assistant.`,
    messages: [
      ...currentState.messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      })),
      { role: 'user', content: message }
    ],
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} selectedModel={{ baseUrl, modelName }} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },

//    tools: {
//      listStocks: {
//        description: 'List three imaginary stocks that are trending.',
//        parameters: z.object({
//          stocks: z.array(
//            z.object({
//              symbol: z.string().describe('The symbol of the stock'),
//              price: z.number().describe('The price of the stock'),
//              delta: z.number().describe('The change in price of the stock')
//            })
//          )
//        }),
//        generate: async function* ({ stocks }) {
//          yield (
//            <BotCard>
//              <StocksSkeleton />
//            </BotCard>
//          )
//
//          await sleep(1000)
//
//          const toolCallId = nanoid()
//
//          aiState.done({
//            ...aiState.get(),
//            messages: [
//              ...aiState.get().messages,
//              {
//                id: nanoid(),
//                role: 'assistant',
//                content: [
//                  {
//                    type: 'tool-call',
//                    toolName: 'listStocks',
//                    toolCallId,
//                    args: { stocks }
//                  }
//                ]
//              },
//              {
//                id: nanoid(),
//                role: 'tool',
//                content: [
//                  {
//                    type: 'tool-result',
//                    toolName: 'listStocks',
//                    toolCallId,
//                    result: stocks
//                  }
//                ]
//              }
//            ]
//          })
//
//          return (
//            <BotCard>
//              <Stocks props={stocks} />
//            </BotCard>
//          )
//        }
//      },
//      showStockPrice: {
//        description:
//          'Get the current stock price of a given stock or currency. Use this to show the price to the user.',
//        parameters: z.object({
//          symbol: z
//            .string()
//            .describe(
//              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
//            ),
//          price: z.number().describe('The price of the stock.'),
//          delta: z.number().describe('The change in price of the stock')
//        }),
//        generate: async function* ({ symbol, price, delta }) {
//          yield (
//            <BotCard>
//              <StockSkeleton />
//            </BotCard>
//          )
//
//          await sleep(1000)
//
//          const toolCallId = nanoid()
//
//          aiState.done({
//            ...aiState.get(),
//            messages: [
//              ...aiState.get().messages,
//              {
//                id: nanoid(),
//                role: 'assistant',
//                content: [
//                  {
//                    type: 'tool-call',
//                    toolName: 'showStockPrice',
//                    toolCallId,
//                    args: { symbol, price, delta }
//                  }
//                ]
//              },
//              {
//                id: nanoid(),
//                role: 'tool',
//                content: [
//                  {
//                    type: 'tool-result',
//                    toolName: 'showStockPrice',
//                    toolCallId,
//                    result: { symbol, price, delta }
//                  }
//                ]
//              }
//            ]
//          })
//
//          return (
//            <BotCard>
//              <Stock props={{ symbol, price, delta }} />
//            </BotCard>
//          )
//        }
//      },
//      showStockPurchase: {
//        description:
//          'Show price and the UI to purchase a stock or currency. Use this if the user wants to purchase a stock or currency.',
//        parameters: z.object({
//          symbol: z
//            .string()
//            .describe(
//              'The name or symbol of the stock or currency. e.g. DOGE/AAPL/USD.'
//            ),
//          price: z.number().describe('The price of the stock.'),
//          numberOfShares: z
//            .number()
//            .optional()
//            .describe(
//              'The **number of shares** for a stock or currency to purchase. Can be optional if the user did not specify it.'
//            )
//        }),
//        generate: async function* ({ symbol, price, numberOfShares = 100 }) {
//          const toolCallId = nanoid()
//
//          if (numberOfShares <= 0 || numberOfShares > 1000) {
//            aiState.done({
//              ...aiState.get(),
//              messages: [
//                ...aiState.get().messages,
//                {
//                  id: nanoid(),
//                  role: 'assistant',
//                  content: [
//                    {
//                      type: 'tool-call',
//                      toolName: 'showStockPurchase',
//                      toolCallId,
//                      args: { symbol, price, numberOfShares }
//                    }
//                  ]
//                },
//                {
//                  id: nanoid(),
//                  role: 'tool',
//                  content: [
//                    {
//                      type: 'tool-result',
//                      toolName: 'showStockPurchase',
//                      toolCallId,
//                      result: {
//                        symbol,
//                        price,
//                        numberOfShares,
//                        status: 'expired'
//                      }
//                    }
//                  ]
//                },
//                {
//                  id: nanoid(),
//                  role: 'system',
//                  content: `[User has selected an invalid amount]`
//                }
//              ]
//            })
//
//            return <BotMessage content={'Invalid amount'} />
//          } else {
//            aiState.done({
//              ...aiState.get(),
//              messages: [
//                ...aiState.get().messages,
//                {
//                  id: nanoid(),
//                  role: 'assistant',
//                  content: [
//                    {
//                      type: 'tool-call',
//                      toolName: 'showStockPurchase',
//                      toolCallId,
//                      args: { symbol, price, numberOfShares }
//                    }
//                  ]
//                },
//                {
//                  id: nanoid(),
//                  role: 'tool',
//                  content: [
//                    {
//                      type: 'tool-result',
//                      toolName: 'showStockPurchase',
//                      toolCallId,
//                      result: {
//                        symbol,
//                        price,
//                        numberOfShares
//                      }
//                    }
//                  ]
//                }
//              ]
//            })
//
//            return (
//              <BotCard>
//                <Purchase
//                  props={{
//                    numberOfShares,
//                    symbol,
//                    price: +price,
//                    status: 'requires_action'
//                  }}
//                />
//              </BotCard>
//            )
//          }
//        }
//      },
//      getEvents: {
//        description:
//          'List funny imaginary events between user highlighted dates that describe stock activity.',
//        parameters: z.object({
//          events: z.array(
//            z.object({
//              date: z
//                .string()
//                .describe('The date of the event, in ISO-8601 format'),
//              headline: z.string().describe('The headline of the event'),
//              description: z.string().describe('The description of the event')
//            })
//          )
//        }),
//        generate: async function* ({ events }) {
//          yield (
//            <BotCard>
//              <EventsSkeleton />
//            </BotCard>
//          )
//
//          await sleep(1000)
//
//          const toolCallId = nanoid()
//
//          aiState.done({
//            ...aiState.get(),
//            messages: [
//              ...aiState.get().messages,
//              {
//                id: nanoid(),
//                role: 'assistant',
//                content: [
//                  {
//                    type: 'tool-call',
//                    toolName: 'getEvents',
//                    toolCallId,
//                    args: { events }
//                  }
//                ]
//              },
//              {
//                id: nanoid(),
//                role: 'tool',
//                content: [
//                  {
//                    type: 'tool-result',
//                    toolName: 'getEvents',
//                    toolCallId,
//                    result: events
//                  }
//                ]
//              }
//            ]
//          })
//
//          return (
//            <BotCard>
//              <Events props={events} />
//            </BotCard>
//          )
//        }
//      }
//    }

  })

  console.log('submitUserMessage result:', result);
  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
  selectedModel?: KamiwazaModel
}

type KamiwazaModel = {
  baseUrl: string;
  modelName: string;
};

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'listStocks' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Stocks props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPrice' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Stock props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'showStockPurchase' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Purchase props={tool.result} />
              </BotCard>
            ) : tool.toolName === 'getEvents' ? (
              <BotCard>
                {/* @ts-expect-error */}
                <Events props={tool.result} />
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage 
            content={message.content} 
            selectedModel={aiState.selectedModel} 
          />
        ) : null
    }))
}

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
    confirmPurchase,
    selectModel
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [], selectedModel: undefined },
  onGetUIState: async () => {
    'use server'

    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    let userData = null

    if (token) {
      try {
        userData = await verifyToken()
      } catch (error) {
        console.error('Error verifying token:', error)
      }
    }

    if (userData) {
      const aiState = getAIState() as Chat
      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    }
    return
  },
  onSetAIState: async ({ state, done }) => {
    'use server'
    console.log('onSetAIState: Starting with state:', state, 'done:', done)

    if (!done) return

    const cookieStore = cookies()
    const token = cookieStore.get('token')?.value
    console.log('onSetAIState: Token:', token?.substring(0, 10) + '...')
    let userData = null

    if (token) {
      try {
        userData = await verifyToken()
        console.log('onSetAIState: UserData after verify:', userData)
      } catch (error) {
        console.error('onSetAIState: Error verifying token:', error)
      }
    }

    const { chatId, messages, selectedModel } = state
    const createdAt = new Date()
    const userId = userData?.id || 'anonymous'
    const path = `/chat/${chatId}`

    const firstMessageContent = messages[0].content as string
    const title = firstMessageContent.substring(0, 100)

    const chat: Chat = {
      id: chatId,
      title,
      userId,
      createdAt,
      messages,
      path,
      selectedModel
    }

    console.log('onSetAIState: Saving chat with userId:', userId)
    await saveChat(chat)
  }
})
