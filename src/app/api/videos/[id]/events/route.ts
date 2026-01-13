import { NextRequest, NextResponse } from 'next/server';
import RedisService from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const channel = `video:status:${id}`;

  const stream = new ReadableStream({
    async start(controller) {
      const subscriber = RedisService.createClient();
      
      const messageHandler = (chan: string, message: string) => {
        if (chan === channel) {
          const data = `data: ${message}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }
      };

      await subscriber.subscribe(channel);
      subscriber.on('message', messageHandler);

      request.signal.addEventListener('abort', () => {
        subscriber.off('message', messageHandler);
        subscriber.unsubscribe(channel);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
