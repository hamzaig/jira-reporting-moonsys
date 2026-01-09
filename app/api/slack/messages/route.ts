import { NextRequest, NextResponse } from 'next/server';
import {
  getMessagesByChannel,
  getMessagesByUser,
  getCheckInOutMessages,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const channelId = searchParams.get('channelId');
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'checkin', 'checkout', or 'all'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    let messages;

    if (type === 'checkin' || type === 'checkout') {
      // Get check-in/check-out messages
      messages = getCheckInOutMessages(startDate || undefined, endDate || undefined);
      
      // Filter by type if specified
      if (type === 'checkin') {
        messages = messages.filter(m => m.message_type === 'checkin');
      } else if (type === 'checkout') {
        messages = messages.filter(m => m.message_type === 'checkout');
      }
    } else if (!type || type === 'all') {
      // Get all check-in/check-out messages
      messages = getCheckInOutMessages(startDate || undefined, endDate || undefined);
    } else if (channelId) {
      // Get messages by channel
      messages = getMessagesByChannel(channelId, limit);
    } else if (userId) {
      // Get messages by user
      messages = getMessagesByUser(userId, limit);
    } else {
      // Get all check-in/check-out messages by default
      messages = getCheckInOutMessages(startDate || undefined, endDate || undefined);
    }

    // Apply date filters if provided
    if (startDate || endDate) {
      messages = messages.filter(m => {
        const messageDate = new Date(parseFloat(m.timestamp) * 1000).toISOString().split('T')[0];
        if (startDate && messageDate < startDate) return false;
        if (endDate && messageDate > endDate) return false;
        return true;
      });
    }

    // Limit results
    messages = messages.slice(0, limit);

    return NextResponse.json({
      success: true,
      count: messages.length,
      messages: messages,
    });

  } catch (error: any) {
    console.error('Error fetching Slack messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    );
  }
}

