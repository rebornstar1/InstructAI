import { NextResponse } from 'next/server';
import redis from '@/lib/redis'; // Your Redis implementation

export async function GET(request) {
  // Get the key from the URL query parameters
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: 'Cache key is required' }, { status: 400 });
  }
  
  try {
    const cachedData = await redis.get(key);
    
    if (!cachedData) {
      return NextResponse.json({ data: null, cached: false });
    }
    
    return NextResponse.json({ 
      data: JSON.parse(cachedData), 
      cached: true 
    });
  } catch (error) {
    console.error('Redis cache error:', error);
    return NextResponse.json({ error: 'Cache error' }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json();
  const { key, data, expiration = 3600 } = body;
  
  if (!key || !data) {
    return NextResponse.json({ error: 'Cache key and data are required' }, { status: 400 });
  }
  
  try {
    await redis.setex(key, expiration, JSON.stringify(data));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Redis cache error:', error);
    return NextResponse.json({ error: 'Cache error' }, { status: 500 });
  }
}