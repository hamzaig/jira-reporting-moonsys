# Environment Variables Setup

## Your Current Configuration

Based on your setup, here's what you need:

```bash
# Option 1: Use DATABASE_URL (Recommended)
DATABASE_URL=mysql://moonsys:MoonSys722942%5E@db.moonsys.co:3306/moonsys_erp

# Option 2: Use Individual Variables
DATABASE_CLIENT=mysql
DATABASE_HOST=db.moonsys.co
DATABASE_PORT=3306
DATABASE_USER=moonsys
DATABASE_PASSWORD=MoonSys722942^
DATABASE_NAME=moonsys_erp
```

## Important Notes

### 1. Password Encoding in URL

If using `DATABASE_URL`, special characters in password need to be URL-encoded:

- `^` becomes `%5E`
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `&` becomes `%26`
- `+` becomes `%2B`
- `=` becomes `%3D`
- `?` becomes `%3F`

**Your password:** `MoonSys722942^`
**Encoded:** `MoonSys722942%5E`

### 2. Database Name

The code will use whatever database name is in the connection string or `DATABASE_NAME` variable.

Your database: `moonsys_erp`

The table `slack_messages` will be created in this database automatically.

### 3. Vercel Environment Variables

Add these in Vercel Dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** `mysql://moonsys:MoonSys722942%5E@db.moonsys.co:3306/moonsys_erp`
   - **Environment:** Production, Preview, Development (select all)
3. Click **Save**

### 4. Local Development (.env.local)

Create `.env.local` file:

```bash
DATABASE_URL=mysql://moonsys:MoonSys722942%5E@db.moonsys.co:3306/moonsys_erp
```

Or use individual variables:

```bash
DATABASE_HOST=db.moonsys.co
DATABASE_PORT=3306
DATABASE_USER=moonsys
DATABASE_PASSWORD=MoonSys722942^
DATABASE_NAME=moonsys_erp
```

## Testing Connection

After setting environment variables, test:

```bash
# Test endpoint
curl https://your-app.vercel.app/api/slack/test

# Should return:
{
  "success": true,
  "databaseAvailable": true,
  "totalMessages": 0,
  ...
}
```

## Troubleshooting

### Issue: Still getting access denied

1. **Check password encoding:**
   - Make sure `^` is encoded as `%5E` in URL
   - Or use individual variables (no encoding needed)

2. **Check database name:**
   - Verify database `moonsys_erp` exists
   - Verify user `moonsys` has access to this database

3. **Check MySQL user permissions:**
   ```sql
   SHOW GRANTS FOR 'moonsys'@'%';
   ```
   Should show access to `moonsys_erp` database

4. **Test connection manually:**
   ```bash
   mysql -h db.moonsys.co -u moonsys -p moonsys_erp
   # Enter password: MoonSys722942^
   ```

### Issue: Table not found

The table `slack_messages` will be created automatically on first connection. If it doesn't:

1. Check database name is correct
2. Check user has CREATE TABLE permission
3. Check application logs for errors

## Quick Fix Commands

If you need to manually create the table:

```sql
USE moonsys_erp;

CREATE TABLE IF NOT EXISTS slack_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  channel_id VARCHAR(255) NOT NULL,
  channel_name VARCHAR(255),
  user_id VARCHAR(255) NOT NULL,
  user_name VARCHAR(255),
  message_text TEXT NOT NULL,
  message_type ENUM('checkin', 'checkout', 'other') DEFAULT 'other',
  timestamp VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_channel_id (channel_id),
  INDEX idx_user_id (user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_message_type (message_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

