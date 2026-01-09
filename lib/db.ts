import mysql from 'mysql2/promise';

// MySQL connection pool
let pool: mysql.Pool | null = null;
let dbInitialized = false;

// Get MySQL connection pool
function getPool(): mysql.Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.MYSQL_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL or MYSQL_URL environment variable is required');
    }

    // Parse connection string or use direct config
    let config: mysql.PoolOptions;
    
    if (connectionString.startsWith('mysql://')) {
      // Parse MySQL connection string
      // Handle special characters in password by decoding URL
      const url = new URL(connectionString);
      config = {
        host: url.hostname,
        port: parseInt(url.port || '3306'),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password), // Decode password to handle special chars like ^
        database: url.pathname.slice(1), // Remove leading /
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      };
    } else {
      // Use environment variables directly
      // Support both DATABASE_* and MYSQL_* prefixes
      config = {
        host: process.env.DATABASE_HOST || process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || process.env.MYSQL_PORT || '3306'),
        user: process.env.DATABASE_USER || process.env.MYSQL_USER || 'root',
        password: process.env.DATABASE_PASSWORD || process.env.MYSQL_PASSWORD || '',
        database: process.env.DATABASE_NAME || process.env.MYSQL_DATABASE || 'slack_messages',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
      };
    }

    console.log('🗄️ Initializing MySQL connection pool...');
    console.log('🔗 Connecting to:', {
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      passwordSet: !!config.password, // Don't log password
    });
    pool = mysql.createPool(config);
    dbInitialized = true;
    console.log('✅ MySQL connection pool created successfully');
    
    // Initialize database schema (async, but don't wait)
    initializeDatabase().catch(err => {
      console.error('⚠️ Schema initialization error (non-fatal):', err);
    });
  }
  
  return pool;
}

// Initialize database schema
async function initializeDatabase(): Promise<void> {
  try {
    const connection = await getPool().getConnection();
    
    await connection.query(`
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    connection.release();
    console.log('✅ Database schema initialized');
  } catch (error: any) {
    // Check if it's an access denied error
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('❌ MySQL Access Denied Error!');
      console.error('💡 Solution: Grant remote access to MySQL user');
      console.error('💡 Run this SQL command on your MySQL server:');
      console.error('   GRANT ALL PRIVILEGES ON slack_messages.* TO \'moonsys\'@\'%\' IDENTIFIED BY \'your_password\';');
      console.error('   FLUSH PRIVILEGES;');
      console.error('💡 See MYSQL_ACCESS_FIX.md for detailed instructions');
    }
    console.error('❌ Error initializing database schema:', error);
    throw error;
  }
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

export function isDatabaseAvailable(): boolean {
  try {
    if (!dbInitialized) {
      getPool();
    }
    return pool !== null && dbInitialized;
  } catch (error: any) {
    console.warn('⚠️ Database not available:', error.message);
    return false;
  }
}

/**
 * Get total message count (for debugging)
 */
export async function getTotalMessageCount(): Promise<number> {
  try {
    if (!isDatabaseAvailable()) {
      return 0;
    }
    const [rows] = await getPool().query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM slack_messages'
    );
    return rows[0]?.count || 0;
  } catch (error: any) {
    console.error('Error getting message count:', error);
    return 0;
  }
}

export async function saveSlackMessage(
  message: Omit<SlackMessage, 'id' | 'created_at'>
): Promise<void> {
  try {
    if (!isDatabaseAvailable()) {
      console.warn('⚠️ Database not available, skipping save');
      return;
    }
    
    console.log('🗄️ Database: Attempting to save message...');
    const connection = await getPool().getConnection();
    
    await connection.query(
      `INSERT INTO slack_messages 
       (message_id, channel_id, channel_name, user_id, user_name, message_text, message_type, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE message_id = message_id`,
      [
        message.message_id,
        message.channel_id,
        message.channel_name || null,
        message.user_id,
        message.user_name || null,
        message.message_text,
        message.message_type,
        message.timestamp
      ]
    );
    
    connection.release();
    console.log('✅ Database: Message saved successfully');
  } catch (error: any) {
    console.error('❌ Database: Error saving message:', error);
    // Don't throw - allow the request to complete
  }
}

export async function getMessagesByChannel(
  channelId: string,
  limit: number = 100
): Promise<SlackMessage[]> {
  try {
    if (!isDatabaseAvailable()) {
      return [];
    }
    
    const connection = await getPool().getConnection();
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT * FROM slack_messages 
       WHERE channel_id = ? 
       ORDER BY CAST(timestamp AS DECIMAL(20, 10)) DESC 
       LIMIT ?`,
      [channelId, limit]
    );
    
    connection.release();
    return rows as SlackMessage[];
  } catch (error: any) {
    console.error('❌ Database: Error fetching messages by channel:', error);
    return [];
  }
}

export async function getMessagesByUser(
  userId: string,
  limit: number = 100
): Promise<SlackMessage[]> {
  try {
    if (!isDatabaseAvailable()) {
      return [];
    }
    
    const connection = await getPool().getConnection();
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT * FROM slack_messages 
       WHERE user_id = ? 
       ORDER BY CAST(timestamp AS DECIMAL(20, 10)) DESC 
       LIMIT ?`,
      [userId, limit]
    );
    
    connection.release();
    return rows as SlackMessage[];
  } catch (error: any) {
    console.error('❌ Database: Error fetching messages by user:', error);
    return [];
  }
}

export async function getCheckInOutMessages(
  startDate?: string,
  endDate?: string
): Promise<SlackMessage[]> {
  try {
    if (!isDatabaseAvailable()) {
      console.warn('⚠️ Database not available for getCheckInOutMessages');
      return [];
    }
    
    let query = `
      SELECT * FROM slack_messages 
      WHERE message_type IN ('checkin', 'checkout')
    `;
    
    const params: any[] = [];
    
    // For date filtering, convert date to timestamp
    if (startDate || endDate) {
      if (startDate) {
        const startTimestamp = new Date(startDate + 'T00:00:00+05:00').getTime() / 1000;
        query += ' AND CAST(timestamp AS DECIMAL(20, 10)) >= ?';
        params.push(startTimestamp.toString());
      }
      
      if (endDate) {
        const endTimestamp = new Date(endDate + 'T23:59:59+05:00').getTime() / 1000;
        query += ' AND CAST(timestamp AS DECIMAL(20, 10)) <= ?';
        params.push(endTimestamp.toString());
      }
    }
  
    query += ' ORDER BY CAST(timestamp AS DECIMAL(20, 10)) DESC';
  
    console.log('🔍 Query:', query);
    console.log('📋 Params:', params);
    
    const connection = await getPool().getConnection();
    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);
    connection.release();
    
    const results = rows as SlackMessage[];
    console.log('📊 Found', results.length, 'messages in database');
    
    // Verify results
    if (results.length > 0) {
      console.log('✅ Sample message:', {
        id: results[0].id,
        user: results[0].user_name,
        type: results[0].message_type,
        timestamp: results[0].timestamp
      });
    }
    
    return results;
  } catch (error: any) {
    console.error('❌ Database: Error fetching check-in/out messages:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return [];
  }
}

// Close database connection (useful for cleanup)
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    dbInitialized = false;
  }
}
