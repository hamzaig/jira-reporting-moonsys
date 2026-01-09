# Slack Integration Troubleshooting

## Problem: No logs are being received

### Step 1: Verify Endpoint is Accessible

1. **Test the endpoint directly:**
   ```bash
   curl http://localhost:3000/api/slack/test
   ```
   
   Or visit in browser: `http://localhost:3000/api/slack/test`
   
   Should return:
   ```json
   {
     "success": true,
     "databaseConnected": true,
     "totalMessages": 0,
     ...
   }
   ```

2. **Check if events endpoint is reachable:**
   ```bash
   curl -X GET http://localhost:3000/api/slack/events
   ```
   
   Should return:
   ```json
   {
     "message": "Slack Events API endpoint is active",
     "timestamp": "..."
   }
   ```

### Step 2: Check Environment Variables

Make sure `.env.local` has:
```env
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_SIGNING_SECRET=your-secret-here
```

Verify they're loaded:
```bash
# Check if variables are set (in your terminal)
echo $SLACK_BOT_TOKEN
```

### Step 3: Verify Slack App Configuration

1. **Go to https://api.slack.com/apps**
2. **Select your app**
3. **Go to "Event Subscriptions"**
4. **Check:**
   - ✅ "Enable Events" is ON
   - ✅ Request URL is correct (for local: use ngrok URL)
   - ✅ Under "Subscribe to bot events", you have:
     - `message.channels`

5. **Go to "OAuth & Permissions"**
   - ✅ Bot Token Scopes include:
     - `channels:read`
     - `channels:history`
     - `users:read`

### Step 4: For Local Development - Use Ngrok

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Update Slack App:**
   - Go to Event Subscriptions
   - Set Request URL to: `https://abc123.ngrok.io/api/slack/events`
   - Slack will verify the URL

### Step 5: Check Server Logs

When a message is sent in Slack, you should see logs like:

```
🚀 Slack Events API: Request received
📅 Time: 2026-01-09T...
🔑 Config check: { hasSigningSecret: true, hasSlackToken: true }
📦 Event received: { type: 'event_callback', eventType: 'message', ... }
💬 Message event details: { channel: 'C123...', user: 'U123...', ... }
💾 Saving message to database: { ... }
✅ Message saved successfully!
```

### Step 6: Test Manually

1. **Send a test message in #general channel:**
   - Type: "checkin" or "checkout"
   - Check server logs immediately

2. **If no logs appear:**
   - Check ngrok is running (for local dev)
   - Check Slack app Request URL is correct
   - Check Slack app is installed to workspace
   - Check bot has permission to read #general channel

### Step 7: Common Issues

**Issue: "Invalid signature"**
- Check `SLACK_SIGNING_SECRET` is correct
- Make sure it's from "Basic Information" → "App Credentials"

**Issue: "No events received"**
- Verify Request URL in Slack app
- Check ngrok is running (for local)
- Make sure bot is added to #general channel
- Check Event Subscriptions are enabled

**Issue: "Messages not saving"**
- Check database directory exists: `data/`
- Check write permissions
- Check server logs for database errors

**Issue: "Channel name not matching"**
- The code now processes ALL channels (not just 'general')
- Check logs to see what channel name is detected

### Step 8: Debug Commands

**Check database:**
```bash
# If you have sqlite3 installed
sqlite3 data/slack_messages.db "SELECT COUNT(*) FROM slack_messages;"
sqlite3 data/slack_messages.db "SELECT * FROM slack_messages ORDER BY created_at DESC LIMIT 10;"
```

**Check if endpoint is working:**
```bash
curl -X POST http://localhost:3000/api/slack/events \
  -H "Content-Type: application/json" \
  -d '{"type":"url_verification","challenge":"test123"}'
```

Should return: `{"challenge":"test123"}`

### Still Not Working?

1. **Check Slack app logs:**
   - Go to https://api.slack.com/apps
   - Select your app
   - Go to "Event Subscriptions"
   - Scroll down to see "Recent events"
   - Check if events are being sent

2. **Enable verbose logging:**
   - All logs are now in console
   - Check your terminal where `npm run dev` is running

3. **Verify database file:**
   - Check if `data/slack_messages.db` exists
   - Check file permissions

