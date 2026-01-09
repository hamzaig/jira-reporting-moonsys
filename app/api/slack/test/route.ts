import { NextRequest, NextResponse } from 'next/server';
import { getCheckInOutMessages, getTotalMessageCount, isDatabaseAvailable } from '@/lib/db';

export async function GET() {
  try {
    console.log('🧪 Test endpoint called');
    
    // Check database availability
    const dbAvailable = isDatabaseAvailable();
    console.log('📊 Database available:', dbAvailable);
    
    // Get total message count
    const totalCount = await getTotalMessageCount();
    console.log('📊 Total messages in database:', totalCount);
    
    // Get all check-in/check-out messages
    const messages = await getCheckInOutMessages();
    console.log('📊 Check-in/out messages:', messages.length);
    
    // Get recent messages
    const recentMessages = messages.slice(0, 10);
    
    return NextResponse.json({
      success: true,
      databaseAvailable: dbAvailable,
      totalMessages: totalCount,
      checkInOutMessages: messages.length,
      recentMessages: recentMessages,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

