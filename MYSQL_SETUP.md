# MySQL Setup Guide

## Overview

The application now uses **MySQL** instead of SQLite. This ensures data persistence on Vercel and other serverless platforms.

## Environment Variables

You need to set one of these environment variables:

### Option 1: Connection String (Recommended)
```bash
DATABASE_URL=mysql://user:password@host:port/database_name
# OR
MYSQL_URL=mysql://user:password@host:port/database_name
```

### Option 2: Individual Variables
```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=slack_messages
```

## MySQL Hosting Options

### Option 1: PlanetScale (Recommended for Vercel) ⭐

**Best for:** Serverless MySQL, free tier available

**Setup:**
1. Go to [planetscale.com](https://planetscale.com)
2. Sign up (free)
3. Create a new database
4. Copy the connection string
5. Add to Vercel environment variables as `DATABASE_URL`

**Free Tier:**
- 1 database
- 1 GB storage
- 1 billion row reads/month
- 10 million row writes/month

**Connection String Format:**
```
mysql://username:password@host.planetscale.com/database_name?sslaccept=strict
```

---

### Option 2: Railway MySQL

**Setup:**
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Add MySQL service
4. Copy connection string
5. Add to Vercel as `DATABASE_URL`

**Free Tier:**
- $5 credit/month
- Pay-as-you-go

---

### Option 3: Aiven MySQL

**Setup:**
1. Go to [aiven.io](https://aiven.io)
2. Create account
3. Create MySQL service
4. Copy connection string
5. Add to Vercel as `DATABASE_URL`

---

### Option 4: Local MySQL (Development)

**Install MySQL:**
```bash
# macOS
brew install mysql
brew services start mysql

# Ubuntu/Debian
sudo apt-get install mysql-server
sudo systemctl start mysql

# Windows
# Download from https://dev.mysql.com/downloads/mysql/
```

**Create Database:**
```sql
CREATE DATABASE slack_messages;
CREATE USER 'slack_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON slack_messages.* TO 'slack_user'@'localhost';
FLUSH PRIVILEGES;
```

**Set Environment Variable:**
```bash
DATABASE_URL=mysql://slack_user:your_password@localhost:3306/slack_messages
```

---

## Installation

Install the MySQL package:

```bash
npm install mysql2
```

---

## Database Schema

The schema will be automatically created on first run. If you need to create it manually:

```sql
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

---

## Vercel Setup

### Step 1: Create MySQL Database

Choose one of the hosting options above (PlanetScale recommended).

### Step 2: Add Environment Variable

1. Go to Vercel Dashboard → Your Project
2. Go to **Settings** → **Environment Variables**
3. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** Your MySQL connection string
   - **Environment:** Production, Preview, Development (select all)
4. Click **Save**

### Step 3: Deploy

The schema will be automatically created on first deployment.

---

## Testing

After setup, test the connection:

1. Visit: `https://your-app.vercel.app/api/slack/test`
2. Should show: `databaseAvailable: true`
3. Send a test message in Slack
4. Check if it appears in the database

---

## Migration from SQLite

If you have existing SQLite data:

1. Export data from SQLite:
```bash
sqlite3 data/slack_messages.db .dump > backup.sql
```

2. Convert SQLite SQL to MySQL SQL (manual conversion needed)

3. Import to MySQL:
```bash
mysql -u user -p database_name < converted_backup.sql
```

---

## Troubleshooting

### Connection Error
- Verify connection string format
- Check database credentials
- Ensure database server is accessible from Vercel

### Schema Not Created
- Check database permissions
- Verify user has CREATE TABLE privileges
- Check application logs for errors

### SSL Connection Required
Some MySQL hosts (like PlanetScale) require SSL. The connection string should include:
```
?sslaccept=strict
```

---

## Support

For issues:
1. Check application logs in Vercel
2. Test connection with: `/api/slack/test`
3. Verify environment variables are set correctly

