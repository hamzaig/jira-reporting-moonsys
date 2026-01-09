import { NextRequest, NextResponse } from 'next/server';
import { processSlackMessage, verifySlackSignature } from '@/lib/slack';
import { WebClient } from '@slack/web-api';

export async function POST(request: NextRequest) {
  try {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    const slackToken = process.env.SLACK_BOT_TOKEN;
    
    if (!signingSecret) {
      console.error('SLACK_SIGNING_SECRET is not set');
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
    
    // Handle URL verification challenge
    if (event.type === 'url_verification') {
      return NextResponse.json({ challenge: event.challenge });
    }
    
    // Process message events
    if (event.event && event.event.type === 'message') {
      const messageEvent = event.event;
      
      // Skip bot messages and messages without text
      if (!messageEvent.text || messageEvent.user === undefined || messageEvent.subtype) {
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
            } catch (err) {
              console.log('Could not fetch channel info:', err);
            }
          }
          
          // Get user info
          if (messageEvent.user) {
            try {
              const userInfo = await client.users.info({
                user: messageEvent.user,
              });
              userName = (userInfo.user as any)?.real_name || (userInfo.user as any)?.name;
            } catch (err) {
              console.log('Could not fetch user info:', err);
            }
          }
        } catch (err) {
          console.error('Error fetching Slack info:', err);
        }
      }
      
      // Only process messages from 'general' channel
      if (channelName === 'general') {
        await processSlackMessage(event, channelName, userName);
      }
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

