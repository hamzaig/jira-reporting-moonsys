import { NextRequest, NextResponse } from 'next/server';
import { processSlackMessage, verifySlackSignature } from '@/lib/slack';
import { WebClient } from '@slack/web-api';

export async function POST(request: NextRequest) {
  console.log('🚀 Slack Events API: Request received');
  console.log('📅 Time:', new Date().toISOString());
  
  try {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    const slackToken = process.env.SLACK_BOT_TOKEN;
    
    console.log('🔑 Config check:', {
      hasSigningSecret: !!signingSecret,
      hasSlackToken: !!slackToken,
    });
    
    if (!signingSecret) {
      console.error('❌ SLACK_SIGNING_SECRET is not set');
      return NextResponse.json(
        { error: 'Slack configuration missing' },
        { status: 500 }
      );
    }
    
    // Get request body as text for signature verification
    const body = await request.text();
    const signature = request.headers.get('x-slack-signature') || '';
    const timestamp = request.headers.get('x-slack-request-timestamp') || '';
    
    // Verify request is from Slack
    if (signature && timestamp) {
      const isValid = verifySlackSignature(body, signature, timestamp, signingSecret);
      if (!isValid) {
        console.error('Invalid Slack signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }
    
    const event = JSON.parse(body);
    
    console.log('📦 Event received:', {
      type: event.type,
      eventType: event.event?.type,
      hasEvent: !!event.event,
    });
    
    // Handle URL verification challenge
    if (event.type === 'url_verification') {
      console.log('✅ URL verification challenge');
      return NextResponse.json({ challenge: event.challenge });
    }
    
    // Process message events
    if (event.event && event.event.type === 'message') {
      const messageEvent = event.event;
      
      console.log('📨 Received message event:', {
        channel: messageEvent.channel,
        user: messageEvent.user,
        text: messageEvent.text?.substring(0, 50),
        subtype: messageEvent.subtype,
      });
      
      // Skip bot messages and messages without text
      if (!messageEvent.text || messageEvent.user === undefined || messageEvent.subtype) {
        console.log('⏭️ Skipping message (bot or no text)');
        return NextResponse.json({ status: 'ok' });
      }
      
      // Get channel and user info if token is available
      let channelName = 'general';
      let userName: string | undefined;
      
      if (slackToken) {
        try {
          const client = new WebClient(slackToken);
          
          // Get channel info
          if (messageEvent.channel) {
            try {
              const channelInfo = await client.conversations.info({
                channel: messageEvent.channel,
              });
              channelName = (channelInfo.channel as any)?.name || 'general';
              console.log('📢 Channel name:', channelName);
            } catch (err) {
              console.log('⚠️ Could not fetch channel info:', err);
              // Try to get channel name from channel ID if it starts with 'C'
              if (messageEvent.channel.startsWith('C')) {
                channelName = 'general'; // Default assumption
              }
            }
          }
          
          // Get user info
          if (messageEvent.user) {
            try {
              const userInfo = await client.users.info({
                user: messageEvent.user,
              });
              userName = (userInfo.user as any)?.real_name || (userInfo.user as any)?.name;
              console.log('👤 User name:', userName);
            } catch (err) {
              console.log('⚠️ Could not fetch user info:', err);
            }
          }
        } catch (err) {
          console.error('❌ Error fetching Slack info:', err);
        }
      } else {
        console.log('⚠️ No Slack token provided, using defaults');
      }
      
      console.log('🔍 Processing message from channel:', channelName);
      
      // Process all messages (not just 'general') - you can change this back if needed
      // For now, let's process all messages to debug
      try {
        await processSlackMessage(event, channelName, userName);
        console.log('✅ Message processed and saved successfully');
      } catch (err) {
        console.error('❌ Error processing message:', err);
      }
    } else {
      console.log('ℹ️ Event type:', event.event?.type || event.type);
    }
    
    return NextResponse.json({ status: 'ok' });
    
  } catch (error: any) {
    console.error('Error processing Slack event:', error);
    return NextResponse.json(
      { error: 'Failed to process event', details: error.message },
      { status: 500 }
    );
  }
}

// Handle GET requests (for testing)
export async function GET() {
  return NextResponse.json({ 
    message: 'Slack Events API endpoint is active',
    timestamp: new Date().toISOString()
  });
}

