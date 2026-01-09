# Slack Integration Setup Guide

This guide will help you connect your Slack "general" channel to save messages (especially check-in/check-out messages) to the database.

## Prerequisites

1. Admin access to your Slack workspace
2. Ability to create Slack apps

## Step 1: Create a Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App"
3. Choose "From scratch"
4. Name your app (e.g., "Jira Reporting Bot")
5. Select your workspace
6. Click "Create App"

## Step 2: Configure Bot Permissions

1. In your app settings, go to "OAuth & Permissions" in the sidebar
2. Scroll down to "Scopes" → "Bot Token Scopes"
3. Add the following scopes:
   - `channels:read` - To read channel information
   - `channels:history` - To read channel messages
   - `users:read` - To read user information
   - `chat:write` - To send messages (optional)
4. Scroll up and click "Install to Workspace"
5. Authorize the app and copy the "Bot User OAuth Token" (starts with `xoxb-`)

## Step 3: Enable Events

1. Go to "Event Subscriptions" in the sidebar
2. Toggle "Enable Events" to ON
3. Set the Request URL to: `https://your-domain.com/api/slack/events`
   - For local development, use ngrok: `https://your-ngrok-url.ngrok.io/api/slack/events`
4. Under "Subscribe to bot events", add:
   - `message.channels` - To receive messages from public channels
5. Click "Save Changes"

## Step 4: Get Signing Secret

1. In "Basic Information" → "App Credentials"
2. Copy the "Signing Secret"

## Step 5: Configure Environment Variables

Add these to your `.env.local` file:

```env
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
```

## Step 6: Install Dependencies

```bash
npm install
# or
bun install
```

## Step 7: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. For local testing, use ngrok to expose your local server:
   ```bash
   ngrok http 3000
   ```
   Update the Request URL in Slack with the ngrok URL.

3. Send a message in the #general channel:
   - Try "checkin" or "check in" (should be saved as check-in)
   - Try "checkout" or "check out" (should be saved as check-out)
   - Try "good morning" (should be saved as check-in)
   - Try "good night" (should be saved as check-out)

## Message Types Detected

The system automatically detects check-in/check-out messages:

### Check-in Patterns:
- `checkin`, `check in`, `check-in`, `ci`, `in`
- `good morning`, `gm`, `morning`
- `starting`, `start`, `begin`
- `here`, `present`, `arrived`

### Check-out Patterns:
- `checkout`, `check out`, `check-out`, `co`, `out`
- `good night`, `gn`, `night`
- `done`, `finished`, `complete`, `ending`, `end`
- `leaving`, `bye`, `goodbye`

## Database Location

Messages are stored in SQLite database at:
- `data/slack_messages.db`

## API Endpoints

- **POST** `/api/slack/events` - Receives Slack events
- **GET** `/api/slack/events` - Health check

## Troubleshooting

1. **Events not received**: 
   - Check that Request URL is correct and accessible
   - Verify ngrok is running (for local dev)
   - Check Slack app logs in the Slack API dashboard

2. **Signature verification failed**:
   - Verify `SLACK_SIGNING_SECRET` is correct
   - Check that the request is coming from Slack

3. **Messages not saved**:
   - Check server logs for errors
   - Verify database directory has write permissions
   - Ensure the message is from the "general" channel

## Production Deployment

1. Update the Request URL in Slack app settings to your production URL
2. Ensure environment variables are set in your hosting platform
3. Make sure the database directory is writable

