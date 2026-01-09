import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Check if we're in a serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// Database file path - use /tmp in serverless environments
const getDbPath = () => {
  if (isServerless) {
    // In serverless, use /tmp directory (writable but ephemeral)
    return '/tmp/slack_messages.db';
  }
  return path.join(process.cwd(), 'data', 'slack_messages.db');
};

// Initialize database connection
let db: Database.Database | null = null;
let dbInitialized = false;

export function getDatabase(): Database.Database {
  if (!db) {
    try {
      const dbPath = getDbPath();
      
      // Ensure data directory exists (only for non-serverless)
      if (!isServerless) {
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
      }
      
      console.log('🗄️ Initializing database at:', dbPath);
      db = new Database(dbPath);
      initializeDatabase(db);
      dbInitialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error: any) {
      console.error('❌ Database initialization failed:', error.message);
      console.error('❌ Error stack:', error.stack);
      // In serverless environments, this might fail
      // We'll handle it gracefully
      throw new Error(`Database initialization failed: ${error.message}`);
    }
  }
  return db;
}

export function isDatabaseAvailable(): boolean {
  try {
    if (!dbInitialized) {
      getDatabase();
    }
    return db !== null;
  } catch {
    return false;
  }
}

function initializeDatabase(database: Database.Database) {
  // Create messages table
  database.exec(`
    CREATE TABLE IF NOT EXISTS slack_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id TEXT UNIQUE NOT NULL,
      channel_id TEXT NOT NULL,
      channel_name TEXT,
      user_id TEXT NOT NULL,
      user_name TEXT,
      message_text TEXT NOT NULL,
      message_type TEXT, -- 'checkin', 'checkout', 'other'
      timestamp TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_channel_id ON slack_messages(channel_id);
    CREATE INDEX IF NOT EXISTS idx_user_id ON slack_messages(user_id);
    CREATE INDEX IF NOT EXISTS idx_timestamp ON slack_messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_message_type ON slack_messages(message_type);
  `);
}

export interface SlackMessage {
  id?: number;
  message_id: string;
  channel_id: string;
  channel_name?: string;
  user_id: string;
  user_name?: string;
  message_text: string;
  message_type: 'checkin' | 'checkout' | 'other';
  timestamp: string;
  created_at?: string;
}

export function saveSlackMessage(message: Omit<SlackMessage, 'id' | 'created_at'>): void {
  try {
    if (!isDatabaseAvailable()) {
      console.warn('⚠️ Database not available, skipping save');
      return;
    }
    
    console.log('🗄️ Database: Attempting to save message...');
    const database = getDatabase();
    console.log('🗄️ Database: Connection established');
    
    const stmt = database.prepare(`
      INSERT OR IGNORE INTO slack_messages 
      (message_id, channel_id, channel_name, user_id, user_name, message_text, message_type, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      message.message_id,
      message.channel_id,
      message.channel_name || null,
      message.user_id,
      message.user_name || null,
      message.message_text,
      message.message_type,
      message.timestamp
    );
    
    console.log('🗄️ Database: Insert result:', {
      changes: result.changes,
      lastInsertRowid: result.lastInsertRowid,
    });
    
    if (result.changes === 0) {
      console.log('⚠️ Database: Message already exists (duplicate)');
    } else {
      console.log('✅ Database: Message saved successfully');
    }
  } catch (error: any) {
    console.error('❌ Database: Error saving message:', error);
    // In serverless environments, database might not be available
    // Log the error but don't crash - this allows URL verification to work
    if (isServerless) {
      console.warn('⚠️ Running on serverless - database operations may be limited');
      console.warn('💡 Consider using a cloud database (PostgreSQL, MongoDB) for production');
    }
    // Don't throw - allow the request to complete
  }
}

export function getMessagesByChannel(
  channelId: string,
  limit: number = 100
): SlackMessage[] {
  try {
    const database = getDatabase();
    
    const stmt = database.prepare(`
      SELECT * FROM slack_messages 
      WHERE channel_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    
    return stmt.all(channelId, limit) as SlackMessage[];
  } catch (error: any) {
    console.error('❌ Database: Error fetching messages by channel:', error);
    return [];
  }
}

export function getMessagesByUser(
  userId: string,
  limit: number = 100
): SlackMessage[] {
  try {
    const database = getDatabase();
    
    const stmt = database.prepare(`
      SELECT * FROM slack_messages 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `);
    
    return stmt.all(userId, limit) as SlackMessage[];
  } catch (error: any) {
    console.error('❌ Database: Error fetching messages by user:', error);
    return [];
  }
}

export function getCheckInOutMessages(
  startDate?: string,
  endDate?: string
): SlackMessage[] {
  try {
    const database = getDatabase();
    
    let query = `
      SELECT * FROM slack_messages 
      WHERE message_type IN ('checkin', 'checkout')
    `;
    
    const params: any[] = [];
    
    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate);
    }
  
    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate);
    }
  
    query += ' ORDER BY timestamp DESC';
  
    const stmt = database.prepare(query);
    return stmt.all(...params) as SlackMessage[];
  } catch (error: any) {
    console.error('❌ Database: Error fetching check-in/out messages:', error);
    return [];
  }
}

// Close database connection (useful for cleanup)
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

