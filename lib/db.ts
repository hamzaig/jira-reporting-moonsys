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
  const connection = await getPool().getConnection();
  const tables = [
    {
      name: 'slack_messages',
      sql: `
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
      `
    },
    {
      name: 'project_categories',
      sql: `
        CREATE TABLE IF NOT EXISTS project_categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          description TEXT,
          color VARCHAR(7) DEFAULT '#6366f1',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'projects',
      sql: `
        CREATE TABLE IF NOT EXISTS projects (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          client_name VARCHAR(255),
          client_logo_url VARCHAR(500),
          category_id INT,
          status ENUM('completed', 'ongoing', 'archived') DEFAULT 'completed',
          start_date DATE,
          end_date DATE,
          budget DECIMAL(15, 2),
          currency VARCHAR(10) DEFAULT 'PKR',
          live_url VARCHAR(500),
          github_url VARCHAR(500),
          documentation_url VARCHAR(500),
          featured BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_slug (slug),
          INDEX idx_category (category_id),
          INDEX idx_status (status),
          INDEX idx_featured (featured)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'project_tags',
      sql: `
        CREATE TABLE IF NOT EXISTS project_tags (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          color VARCHAR(7) DEFAULT '#10b981',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_slug (slug)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'project_tag_relations',
      sql: `
        CREATE TABLE IF NOT EXISTS project_tag_relations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          project_id INT NOT NULL,
          tag_id INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY unique_project_tag (project_id, tag_id),
          INDEX idx_project (project_id),
          INDEX idx_tag (tag_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'project_tech_stack',
      sql: `
        CREATE TABLE IF NOT EXISTS project_tech_stack (
          id INT AUTO_INCREMENT PRIMARY KEY,
          project_id INT NOT NULL,
          tech_name VARCHAR(100) NOT NULL,
          tech_icon_url VARCHAR(500),
          category ENUM('frontend', 'backend', 'database', 'devops', 'other') DEFAULT 'other',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'project_team_members',
      sql: `
        CREATE TABLE IF NOT EXISTS project_team_members (
          id INT AUTO_INCREMENT PRIMARY KEY,
          project_id INT NOT NULL,
          member_name VARCHAR(255) NOT NULL,
          role VARCHAR(100),
          avatar_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    },
    {
      name: 'project_files',
      sql: `
        CREATE TABLE IF NOT EXISTS project_files (
          id INT AUTO_INCREMENT PRIMARY KEY,
          project_id INT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          file_key VARCHAR(500) NOT NULL,
          file_type VARCHAR(100),
          file_size INT,
          file_category ENUM('screenshot', 'document', 'video', 'other') DEFAULT 'other',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_project (project_id),
          INDEX idx_category (file_category)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const table of tables) {
    try {
      await connection.query(table.sql);
      successCount++;
      console.log(`✅ Table '${table.name}' created/verified`);
    } catch (error: any) {
      errorCount++;
      // Log but continue - some tables might already exist or have permission issues
      if (error.code === 'ER_TABLEACCESS_DENIED_ERROR') {
        console.warn(`⚠️ Permission denied for table '${table.name}' - may need manual creation`);
      } else if (error.code === 'ER_TABLE_EXISTS_ERROR') {
        console.log(`ℹ️ Table '${table.name}' already exists`);
        successCount++; // Count as success since table exists
        errorCount--;
      } else {
        console.error(`❌ Error creating table '${table.name}':`, error.message);
      }
    }
  }

  connection.release();
  
  if (successCount === tables.length) {
    console.log(`✅ Database schema initialized successfully (${successCount} tables)`);
  } else {
    console.log(`⚠️ Database schema partially initialized (${successCount}/${tables.length} tables)`);
    if (errorCount > 0) {
      console.log(`💡 ${errorCount} table(s) had errors - check logs above`);
    }
  }
}

// Export getPool for use by other modules
export { getPool };

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

/**
 * Get user_id for a given user_name (to match existing users)
 */
async function getUserIdByName(user_name: string): Promise<string | null> {
  try {
    if (!isDatabaseAvailable()) {
      return null;
    }
    
    const connection = await getPool().getConnection();
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT user_id FROM slack_messages 
       WHERE user_name = ? 
       LIMIT 1`,
      [user_name]
    );
    
    connection.release();
    
    if (rows.length > 0 && rows[0].user_id) {
      return rows[0].user_id;
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ Database: Error fetching user_id by name:', error);
    return null;
  }
}

/**
 * Save a manual check-in/check-out entry
 */
export async function saveManualEntry(
  user_name: string,
  message_type: 'checkin' | 'checkout',
  timestamp: string,
  message_text?: string
): Promise<void> {
  try {
    if (!isDatabaseAvailable()) {
      console.warn('⚠️ Database not available, skipping save');
      return;
    }
    
    console.log('🗄️ Database: Attempting to save manual entry...');
    const connection = await getPool().getConnection();
    
    // First, try to find existing user_id for this user_name
    let user_id = await getUserIdByName(user_name);
    
    // If no existing user found, generate a new user_id
    if (!user_id) {
      user_id = `manual-${user_name.toLowerCase().replace(/\s+/g, '-')}`;
      console.log('📝 No existing user found, generating new user_id:', user_id);
    } else {
      console.log('✅ Found existing user_id:', user_id, 'for user:', user_name);
    }
    
    // Generate unique message_id for manual entries
    const message_id = `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    await connection.query(
      `INSERT INTO slack_messages 
       (message_id, channel_id, channel_name, user_id, user_name, message_text, message_type, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        message_id,
        'manual', // Special channel_id for manual entries
        'Manual Entry',
        user_id, // Use existing user_id or generated one
        user_name,
        message_text || `${message_type === 'checkin' ? 'Check-In' : 'Check-Out'} (Manual Entry)`,
        message_type,
        timestamp
      ]
    );
    
    connection.release();
    console.log('✅ Database: Manual entry saved successfully');
  } catch (error: any) {
    console.error('❌ Database: Error saving manual entry:', error);
    throw error; // Throw for API to handle
  }
}

/**
 * Delete a message entry by ID
 */
export async function deleteMessage(id: number): Promise<boolean> {
  try {
    if (!isDatabaseAvailable()) {
      console.warn('⚠️ Database not available, cannot delete');
      return false;
    }
    
    console.log('🗄️ Database: Attempting to delete message with ID:', id);
    const connection = await getPool().getConnection();
    
    const [result] = await connection.query<mysql.ResultSetHeader>(
      'DELETE FROM slack_messages WHERE id = ?',
      [id]
    );
    
    connection.release();
    
    if (result.affectedRows > 0) {
      console.log('✅ Database: Message deleted successfully');
      return true;
    } else {
      console.warn('⚠️ Database: No message found with ID:', id);
      return false;
    }
  } catch (error: any) {
    console.error('❌ Database: Error deleting message:', error);
    throw error;
  }
}

/**
 * Get list of unique users from messages
 */
export async function getUniqueUsers(): Promise<Array<{ user_id: string; user_name: string | null }>> {
  try {
    if (!isDatabaseAvailable()) {
      return [];
    }
    
    const connection = await getPool().getConnection();
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT DISTINCT user_id, user_name 
       FROM slack_messages 
       WHERE user_name IS NOT NULL 
       ORDER BY user_name ASC`
    );
    
    connection.release();
    return rows.map(row => ({
      user_id: row.user_id,
      user_name: row.user_name
    }));
  } catch (error: any) {
    console.error('❌ Database: Error fetching unique users:', error);
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
    // IMPORTANT: We extend the endDate by 12 hours (until noon next day) 
    // to capture overnight shift checkouts that happen early next morning
    if (startDate || endDate) {
      if (startDate) {
        const startTimestamp = new Date(startDate + 'T00:00:00+05:00').getTime() / 1000;
        query += ' AND CAST(timestamp AS DECIMAL(20, 10)) >= ?';
        params.push(startTimestamp.toString());
      }
      
      if (endDate) {
        // Extend end date to noon of the NEXT day to capture overnight checkouts
        // This ensures checkouts at 1-2 AM (from previous night shifts) are included
        const endDateObj = new Date(endDate + 'T00:00:00+05:00');
        endDateObj.setDate(endDateObj.getDate() + 1); // Add 1 day
        endDateObj.setHours(12, 0, 0, 0); // Set to noon
        const endTimestamp = endDateObj.getTime() / 1000;
        query += ' AND CAST(timestamp AS DECIMAL(20, 10)) <= ?';
        params.push(endTimestamp.toString());
        console.log('📅 Extended endDate to include overnight checkouts until:', endDateObj.toISOString());
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
