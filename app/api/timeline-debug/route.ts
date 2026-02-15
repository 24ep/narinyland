import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/timeline-debug
export async function GET() {
  try {
    const events = await prisma.timelineEvent.findMany({
      orderBy: { timestamp: 'desc' },
    });

    const response = events.map((e) => {
      const mediaItems = e.mediaUrls?.map((url: string, i: number) => ({
        type: e.mediaTypes?.[i] || 'image',
        url: url
      })) || [];

      return {
        id: e.id,
        text: e.text,
        type: e.type,
        location: e.location,
        timestamp: e.timestamp.toISOString(),
        media: e.mediaUrl ? { type: e.mediaType, url: e.mediaUrl } : (mediaItems[0] || undefined),
        mediaItems: mediaItems.length > 0 ? mediaItems : (e.mediaUrl ? [{ type: e.mediaType, url: e.mediaUrl }] : [])
      };
    });

    return NextResponse.json({
      success: true,
      count: response.length,
      data: response
    });

  } catch (error) {
    console.error('🔍 Debug: Error in timeline API:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
