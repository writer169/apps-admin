import Redis from 'ioredis'

let redis: Redis | null = null

function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(process.env.UPSTASH_REDIS_URL!)
  }
  return redis
}

export interface MagicLinkData {
  appId: string
}

export async function storeMagicLinkToken(
  token: string, 
  appId: string
): Promise<boolean> {
  try {
    const client = getRedisClient()
    const key = `magic_link_token:${token}`
    const data: MagicLinkData = { appId }
    
    // Сохраняем с TTL 15 минут (900 секунд)
    await client.setex(key, 900, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Redis storage error:', error)
    return false
  }
}

export async function getMagicLinkToken(token: string): Promise<MagicLinkData | null> {
  try {
    const client = getRedisClient()
    const key = `magic_link_token:${token}`
    const data = await client.get(key)
    
    if (!data) return null
    
    return JSON.parse(data) as MagicLinkData
  } catch (error) {
    console.error('Redis retrieval error:', error)
    return null
  }
}

export async function deleteMagicLinkToken(token: string): Promise<boolean> {
  try {
    const client = getRedisClient()
    const key = `magic_link_token:${token}`
    await client.del(key)
    return true
  } catch (error) {
    console.error('Redis deletion error:', error)
    return false
  }
}