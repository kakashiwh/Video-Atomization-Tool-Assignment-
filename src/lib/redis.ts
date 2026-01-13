import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisService {
  private static instance: Redis;
  private static subscriberInstance: Redis;

  static getClient() {
    if (!this.instance) {
      this.instance = new Redis(redisUrl);
    }
    return this.instance;
  }

  static createClient() {
    return new Redis(redisUrl);
  }

  static async publish(channel: string, message: any) {
    const client = this.getClient();
    await client.publish(channel, JSON.stringify(message));
  }
}

export default RedisService;
