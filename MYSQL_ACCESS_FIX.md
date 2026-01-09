# MySQL Access Denied Fix

## Problem

Error: `Access denied for user 'moonsys'@'203.99.187.84' (using password: YES)`

This happens because MySQL user is only allowed to connect from specific IPs (usually localhost), but Vercel servers have different IPs.

## Solution

You need to grant MySQL user permission to connect from any IP (or specific IPs).

### Option 1: Allow from Any IP (Recommended for Vercel)

Connect to your MySQL server and run:

```sql
-- Grant access from any IP
GRANT ALL PRIVILEGES ON slack_messages.* TO 'moonsys'@'%' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;
```

**Note:** Replace `your_password` with the actual password.

### Option 2: Allow from Specific IPs (More Secure)

If you know Vercel's IP ranges, you can allow specific IPs:

```sql
-- Allow from specific IP
GRANT ALL PRIVILEGES ON slack_messages.* TO 'moonsys'@'203.99.187.84' IDENTIFIED BY 'your_password';
FLUSH PRIVILEGES;
```

**Note:** Vercel uses multiple IPs, so Option 1 is better.

### Option 3: Create New User for Remote Access

```sql
-- Create new user for remote access
CREATE USER 'moonsys_remote'@'%' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON slack_messages.* TO 'moonsys_remote'@'%';
FLUSH PRIVILEGES;
```

Then update your `DATABASE_URL`:
```
mysql://moonsys_remote:strong_password@your_host:3306/slack_messages
```

## Steps to Fix

### If using cPanel/phpMyAdmin:

1. Go to phpMyAdmin
2. Click on "User accounts" tab
3. Find user 'moonsys'
4. Click "Edit privileges"
5. Under "Login Information", change "Host" from `localhost` to `%` (means any IP)
6. Click "Go"
7. Grant all privileges on `slack_messages` database
8. Click "Go"

### If using MySQL Command Line:

```bash
mysql -u root -p
```

Then run:
```sql
USE mysql;
SELECT user, host FROM user WHERE user = 'moonsys';

-- If user exists with 'localhost' host, update it:
UPDATE user SET host = '%' WHERE user = 'moonsys' AND host = 'localhost';
FLUSH PRIVILEGES;

-- Or create new user:
CREATE USER 'moonsys'@'%' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON slack_messages.* TO 'moonsys'@'%';
FLUSH PRIVILEGES;
```

### If using PlanetScale/Railway/Aiven:

These services usually allow connections from anywhere by default. Check:
1. **PlanetScale**: Connection string should work from anywhere
2. **Railway**: Check "Public Networking" is enabled
3. **Aiven**: Check firewall rules allow connections

## Verify Fix

After making changes, test the connection:

```bash
# Test from command line
mysql -h your_host -u moonsys -p slack_messages
```

Or test via your app:
```
https://your-app.vercel.app/api/slack/test
```

Should show: `databaseAvailable: true`

## Security Note

Using `%` (any IP) is less secure but necessary for Vercel. To improve security:
1. Use strong passwords
2. Limit database privileges (only SELECT, INSERT, UPDATE, DELETE if needed)
3. Consider using SSL connections

## Common Issues

### Issue: Still getting access denied after fix
- **Solution**: Wait a few minutes for MySQL to refresh permissions
- **Solution**: Restart MySQL server
- **Solution**: Double-check password in connection string

### Issue: Can't connect from localhost after changing to %
- **Solution**: Create two users:
  ```sql
  CREATE USER 'moonsys'@'localhost' IDENTIFIED BY 'password';
  CREATE USER 'moonsys'@'%' IDENTIFIED BY 'password';
  GRANT ALL PRIVILEGES ON slack_messages.* TO 'moonsys'@'localhost';
  GRANT ALL PRIVILEGES ON slack_messages.* TO 'moonsys'@'%';
  FLUSH PRIVILEGES;
  ```

### Issue: Firewall blocking connections
- **Solution**: Check MySQL server firewall allows port 3306
- **Solution**: Check hosting provider firewall rules

