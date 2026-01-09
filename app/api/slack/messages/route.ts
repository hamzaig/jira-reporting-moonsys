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
      messages = await getCheckInOutMessages(startDate || undefined, endDate || undefined);
      
      // Filter by type if specified
      if (type === 'checkin') {
        messages = messages.filter(m => m.message_type === 'checkin');
      } else if (type === 'checkout') {
        messages = messages.filter(m => m.message_type === 'checkout');
      }
    } else if (!type || type === 'all') {
      // Get all check-in/check-out messages
      messages = await getCheckInOutMessages(startDate || undefined, endDate || undefined);
    } else if (channelId) {
      // Get messages by channel
      messages = await getMessagesByChannel(channelId, limit);
    } else if (userId) {
      // Get messages by user
      messages = await getMessagesByUser(userId, limit);
    } else {
      // Get all check-in/check-out messages by default
      messages = await getCheckInOutMessages(startDate || undefined, endDate || undefined);
    }

    // Additional date filtering (in case database query didn't filter properly)
    if (startDate || endDate) {
      messages = messages.filter(m => {
        try {
          // Convert timestamp to date in Karachi timezone
          const timestamp = parseFloat(m.timestamp) * 1000;
          const date = new Date(timestamp);
          const karachiDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Karachi',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(date);
          
          if (startDate && karachiDate < startDate) return false;
          if (endDate && karachiDate > endDate) return false;
          return true;
        } catch (err) {
          console.error('Error filtering message by date:', err);
          return true; // Include if date parsing fails
        }
      });
    }

    // Limit results
    messages = messages.slice(0, limit);

    console.log('📤 Returning', messages.length, 'messages');

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

