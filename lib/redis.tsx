import { Redis } from 'ioredis'

const getRedisUrl = () => {
  if (process.env.KV_URL) {
    return process.env.KV_URL
  }

  throw new Error('REDIS_URL is not defined')
}

export const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    if (times > 3) {
      return null
    }
    return Math.min(times * 50, 2000)
  }
})

redis.on('error', (error) => {
  console.error('Redis Client Error:', error)
})
