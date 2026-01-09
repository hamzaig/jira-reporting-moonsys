import { NextRequest, NextResponse } from 'next/server';
import { getCheckInOutMessages, getDatabase } from '@/lib/db';

export async function GET() {
  try {
    console.log('🧪 Test endpoint called');
    
    // Test database connection
    const db = getDatabase();
    console.log('✅ Database connection successful');
    
    // Get all messages
    const messages = getCheckInOutMessages();
    console.log('📊 Total messages in database:', messages.length);
    
    // Get recent messages
    const recentMessages = messages.slice(0, 10);
    
    return NextResponse.json({
      success: true,
      databaseConnected: true,
      totalMessages: messages.length,
      recentMessages: recentMessages,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

