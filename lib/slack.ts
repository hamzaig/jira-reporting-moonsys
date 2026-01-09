import { saveSlackMessage } from './db';

export interface SlackEvent {
  type: string;
  event?: {
    type: string;
    channel: string;
    user: string;
    text: string;
    ts: string;
    channel_type?: string;
  };
  challenge?: string;
  token?: string;
}

/**
 * Parse message to determine if it's a check-in or check-out
 */
export function parseMessageType(text: string): 'checkin' | 'checkout' | 'other' {
  const lowerText = text.toLowerCase().trim();
  
  // Check-in patterns
  const checkInPatterns = [
    /^(checkin|check in|check-in|ci|in)$/i,
    /^(good morning|gm|morning)$/i,
    /^(starting|start|begin)$/i,
    /^(here|present|arrived)$/i,
  ];
  
  // Check-out patterns
  const checkOutPatterns = [
    /^(checkout|check out|check-out|co|out)$/i,
    /^(good night|gn|night)$/i,
    /^(done|finished|complete|ending|end)$/i,
    /^(leaving|bye|goodbye)$/i,
  ];
  
  // Check for check-in
  for (const pattern of checkInPatterns) {
    if (pattern.test(lowerText)) {
      return 'checkin';
    }
  }
  
  // Check for check-out
  for (const pattern of checkOutPatterns) {
    if (pattern.test(lowerText)) {
      return 'checkout';
    }
  }
  
  return 'other';
}

/**
 * Process Slack message event
 */
export async function processSlackMessage(
  event: SlackEvent,
  channelName?: string,
  userName?: string
): Promise<void> {
  console.log('🔄 Processing Slack message...', {
    eventType: event.type,
    hasEvent: !!event.event,
    eventEventType: event.event?.type,
  });
  
  // Handle URL verification challenge
  if (event.type === 'url_verification' && event.challenge) {
    console.log('✅ URL verification challenge received');
    return;
  }
  
  // Process message events
  if (event.event && event.event.type === 'message') {
    const messageEvent = event.event;
    
    console.log('💬 Message event details:', {
      channel: messageEvent.channel,
      user: messageEvent.user,
      text: messageEvent.text?.substring(0, 100),
      ts: messageEvent.ts,
      subtype: messageEvent.subtype,
    });
    
    // Skip bot messages and messages without text
    if (!messageEvent.text || messageEvent.user === undefined) {
      console.log('⏭️ Skipping: no text or user');
      return;
    }
    
    if (messageEvent.subtype) {
      console.log('⏭️ Skipping: has subtype (likely bot or system message)');
      return;
    }
    
    // Only process messages from 'general' channel
    // You can get channel name from Slack API if needed
    const messageType = parseMessageType(messageEvent.text);
    
    console.log('📝 Parsed message type:', messageType);
    
    const messageData = {
      message_id: `${messageEvent.channel}-${messageEvent.ts}`,
      channel_id: messageEvent.channel,
      channel_name: channelName || 'general',
      user_id: messageEvent.user,
      user_name: userName,
      message_text: messageEvent.text,
      message_type: messageType,
      timestamp: messageEvent.ts,
    };
    
    console.log('💾 Saving message to database:', {
      message_id: messageData.message_id,
      channel: messageData.channel_name,
      user: messageData.user_name || messageData.user_id,
      type: messageData.message_type,
    });
    
    try {
      saveSlackMessage(messageData);
      console.log('✅ Message saved successfully!');
    } catch (error) {
      console.error('❌ Error saving message:', error);
      throw error;
    }
  } else {
    console.log('ℹ️ Not a message event, type:', event.event?.type || event.type);
  }
}

import crypto from 'crypto';

/**
 * Verify Slack request signature
 */
export function verifySlackSignature(
  body: string,
  signature: string,
  timestamp: string,
  signingSecret: string
): boolean {
  const hmac = crypto.createHmac('sha256', signingSecret);
  const [version, hash] = signature.split('=');
  
  const baseString = `${version}:${timestamp}:${body}`;
  hmac.update(baseString);
  const computedHash = hmac.digest('hex');
  
  return computedHash === hash;
}

