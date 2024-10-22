import { Redis } from 'ioredis'

let redisClient: Redis | null = null

function createRedisClient() {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err)
    })

    redisClient.on('connect', () => {
      console.log('Redis Client Connected')
    })
  }
  return redisClient
}

// Create and export the singleton instance
export const redis = createRedisClient()