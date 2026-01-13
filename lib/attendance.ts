import { getCheckInOutMessages, SlackMessage } from './db';

const TIMEZONE = 'Asia/Karachi';
const FULL_DAY_HOURS = 6; // 6 hours = full day
const HALF_DAY_HOURS = 3; // Less than 6 but more than 3 = half day
const OVERNIGHT_THRESHOLD_HOUR = 12; // Check-outs before 12:00 PM can belong to previous day's shift

export interface AttendanceRecord {
  date: string;
  user_id: string;
  user_name: string;
  check_in_time: string | null;
  check_out_time: string | null;
  checkout_next_day: boolean; // Indicates if checkout was on the next day (overnight shift)
  work_duration_hours: number;
  status: 'full_day' | 'half_day' | 'day_off' | 'incomplete' | 'missing_checkout' | 'missing_checkin';
  notes: string[];
}

export interface UserAttendance {
  user_id: string;
  user_name: string;
  records: AttendanceRecord[];
  total_days: number;
  full_days: number;
  half_days: number;
  days_off: number;
  incomplete_days: number;
}

/**
 * Convert timestamp to Karachi timezone date string (YYYY-MM-DD)
 */
function getDateInKarachi(timestamp: string): string {
  const date = new Date(parseFloat(timestamp) * 1000);
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

/**
 * Get hour in Karachi timezone (0-23)
 */
function getHourInKarachi(timestamp: string): number {
  const date = new Date(parseFloat(timestamp) * 1000);
  const timeStr = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    hour12: false
  }).format(date);
  return parseInt(timeStr, 10);
}

/**
 * Convert timestamp to Karachi timezone time string (HH:MM)
 */
function getTimeInKarachi(timestamp: string): string {
  const date = new Date(parseFloat(timestamp) * 1000);
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

/**
 * Calculate hours between two timestamps
 */
function calculateHours(checkInTs: string, checkOutTs: string): number {
  const checkIn = parseFloat(checkInTs) * 1000;
  const checkOut = parseFloat(checkOutTs) * 1000;
  const diffMs = checkOut - checkIn;
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.round(diffHours * 100) / 100; // Round to 2 decimal places
}

/**
 * Get the previous date in YYYY-MM-DD format
 */
function getPreviousDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
}

interface WorkSession {
  checkIn: SlackMessage;
  checkOut: SlackMessage | null;
  checkoutNextDay: boolean;
}

/**
 * Get attendance records for a date range
 * Handles overnight shifts where check-out is on the next day
 */
export async function getAttendanceRecords(
  startDate?: string,
  endDate?: string
): Promise<UserAttendance[]> {
  console.log('📅 Getting attendance records for:', { startDate, endDate });
  
  // Get all check-in/check-out messages
  const messages = await getCheckInOutMessages(startDate, endDate);
  
  console.log('📊 Total messages retrieved:', messages.length);
  
  if (messages.length === 0) {
    console.warn('⚠️ No messages found for attendance calculation');
    return [];
  }
  
  // Group messages by user
  const userMessagesMap = new Map<string, { checkins: SlackMessage[], checkouts: SlackMessage[] }>();
  
  messages.forEach(message => {
    const userKey = message.user_id;
    
    if (!userMessagesMap.has(userKey)) {
      userMessagesMap.set(userKey, { checkins: [], checkouts: [] });
    }
    
    const userData = userMessagesMap.get(userKey)!;
    
    if (message.message_type === 'checkin') {
      userData.checkins.push(message);
    } else if (message.message_type === 'checkout') {
      userData.checkouts.push(message);
    }
  });
  
  // Convert to attendance records using session-based pairing
  const userAttendanceMap = new Map<string, UserAttendance>();
  
  userMessagesMap.forEach((userData, userId) => {
    // Sort all check-ins and check-outs by timestamp
    userData.checkins.sort((a, b) => parseFloat(a.timestamp) - parseFloat(b.timestamp));
    userData.checkouts.sort((a, b) => parseFloat(a.timestamp) - parseFloat(b.timestamp));
    
    const sessions: WorkSession[] = [];
    const usedCheckouts = new Set<string>(); // Track which checkouts have been paired
    
    // For each check-in, find the matching check-out
    userData.checkins.forEach(checkIn => {
      const checkInTs = parseFloat(checkIn.timestamp);
      
      // Find the first checkout after this check-in that hasn't been used
      let matchedCheckout: SlackMessage | null = null;
      
      for (const checkOut of userData.checkouts) {
        const checkOutTs = parseFloat(checkOut.timestamp);
        
        // Checkout must be after check-in and not already used
        if (checkOutTs > checkInTs && !usedCheckouts.has(checkOut.timestamp)) {
          matchedCheckout = checkOut;
          usedCheckouts.add(checkOut.timestamp);
          break;
        }
      }
      
      const checkoutNextDay = matchedCheckout 
        ? getDateInKarachi(checkIn.timestamp) !== getDateInKarachi(matchedCheckout.timestamp)
        : false;
      
      sessions.push({
        checkIn,
        checkOut: matchedCheckout,
        checkoutNextDay
      });
    });
    
    // Find orphan checkouts (checkouts without matching check-ins)
    // These are early morning checkouts that might belong to a previous day's shift
    const orphanCheckouts: SlackMessage[] = [];
    userData.checkouts.forEach(checkOut => {
      if (!usedCheckouts.has(checkOut.timestamp)) {
        orphanCheckouts.push(checkOut);
      }
    });
    
    // Build attendance records from sessions
    const recordsMap = new Map<string, AttendanceRecord>();
    const userName = userData.checkins[0]?.user_name || userData.checkouts[0]?.user_name || userId;
    
    sessions.forEach(session => {
      const date = getDateInKarachi(session.checkIn.timestamp);
      
      // If there's already a record for this date, we might have multiple sessions
      // We'll take the first check-in and last check-out of the day
      const existingRecord = recordsMap.get(date);
      
      if (existingRecord) {
        // Update with this session's check-out if it's later
        if (session.checkOut) {
          const existingCheckoutTime = existingRecord.check_out_time;
          const newCheckoutTime = getTimeInKarachi(session.checkOut.timestamp);
          
          if (!existingCheckoutTime || (session.checkoutNextDay && !existingRecord.checkout_next_day)) {
            existingRecord.check_out_time = newCheckoutTime;
            existingRecord.checkout_next_day = session.checkoutNextDay;
            
            // Recalculate work hours
            const firstCheckIn = userData.checkins.find(c => getDateInKarachi(c.timestamp) === date);
            if (firstCheckIn) {
              existingRecord.work_duration_hours = calculateHours(firstCheckIn.timestamp, session.checkOut.timestamp);
            }
          }
        }
        existingRecord.notes.push('Multiple work sessions');
      } else {
        let workHours = 0;
        let status: AttendanceRecord['status'] = 'missing_checkout';
        const notes: string[] = [];
        
        if (session.checkOut) {
          workHours = calculateHours(session.checkIn.timestamp, session.checkOut.timestamp);
          
          if (session.checkoutNextDay) {
            notes.push(`Overnight shift (checkout next day at ${getTimeInKarachi(session.checkOut.timestamp)})`);
          }
          
          if (workHours < HALF_DAY_HOURS) {
            status = 'day_off';
            notes.push(`Worked only ${workHours} hours`);
          } else if (workHours < FULL_DAY_HOURS) {
            status = 'half_day';
            notes.push(`Worked ${workHours} hours (less than ${FULL_DAY_HOURS} hours)`);
          } else {
            status = 'full_day';
            notes.push(`Worked ${workHours} hours`);
          }
        } else {
          notes.push('Check-out missing but check-in recorded');
        }
        
        recordsMap.set(date, {
          date,
          user_id: userId,
          user_name: userName,
          check_in_time: getTimeInKarachi(session.checkIn.timestamp),
          check_out_time: session.checkOut ? getTimeInKarachi(session.checkOut.timestamp) : null,
          checkout_next_day: session.checkoutNextDay,
          work_duration_hours: workHours,
          status,
          notes
        });
      }
    });
    
    // Handle orphan checkouts (early morning checkouts without matching check-in)
    orphanCheckouts.forEach(checkOut => {
      const checkoutDate = getDateInKarachi(checkOut.timestamp);
      const checkoutHour = getHourInKarachi(checkOut.timestamp);
      
      // If checkout is before noon, it might belong to previous day's overnight shift
      if (checkoutHour < OVERNIGHT_THRESHOLD_HOUR) {
        const previousDate = getPreviousDate(checkoutDate);
        const prevRecord = recordsMap.get(previousDate);
        
        // If there's a record from previous day with missing checkout, pair them
        if (prevRecord && prevRecord.status === 'missing_checkout') {
          prevRecord.check_out_time = getTimeInKarachi(checkOut.timestamp);
          prevRecord.checkout_next_day = true;
          
          // Find the check-in for this record
          const checkIn = userData.checkins.find(c => getDateInKarachi(c.timestamp) === previousDate);
          if (checkIn) {
            prevRecord.work_duration_hours = calculateHours(checkIn.timestamp, checkOut.timestamp);
            
            // Update status based on work hours
            prevRecord.notes = [`Overnight shift (checkout next day at ${getTimeInKarachi(checkOut.timestamp)})`];
            
            if (prevRecord.work_duration_hours < HALF_DAY_HOURS) {
              prevRecord.status = 'day_off';
              prevRecord.notes.push(`Worked only ${prevRecord.work_duration_hours} hours`);
            } else if (prevRecord.work_duration_hours < FULL_DAY_HOURS) {
              prevRecord.status = 'half_day';
              prevRecord.notes.push(`Worked ${prevRecord.work_duration_hours} hours (less than ${FULL_DAY_HOURS} hours)`);
            } else {
              prevRecord.status = 'full_day';
              prevRecord.notes.push(`Worked ${prevRecord.work_duration_hours} hours`);
            }
          }
          return; // Don't create orphan record
        }
      }
      
      // Create orphan checkout record (missing check-in)
      if (!recordsMap.has(checkoutDate)) {
        recordsMap.set(checkoutDate, {
          date: checkoutDate,
          user_id: userId,
          user_name: userName,
          check_in_time: null,
          check_out_time: getTimeInKarachi(checkOut.timestamp),
          checkout_next_day: false,
          work_duration_hours: 0,
          status: 'missing_checkin',
          notes: ['Check-in missing but check-out recorded']
        });
      }
    });
    
    // Convert to array and calculate stats
    const records = Array.from(recordsMap.values());
    let fullDays = 0;
    let halfDays = 0;
    let daysOff = 0;
    let incompleteDays = 0;
    
    records.forEach(record => {
      switch (record.status) {
        case 'full_day':
          fullDays++;
          break;
        case 'half_day':
          halfDays++;
          break;
        case 'day_off':
          daysOff++;
          break;
        case 'missing_checkout':
        case 'missing_checkin':
          incompleteDays++;
          break;
      }
    });
    
    // Sort records by date (newest first)
    records.sort((a, b) => b.date.localeCompare(a.date));
    
    userAttendanceMap.set(userId, {
      user_id: userId,
      user_name: userName,
      records,
      total_days: records.length,
      full_days: fullDays,
      half_days: halfDays,
      days_off: daysOff,
      incomplete_days: incompleteDays
    });
  });
  
  return Array.from(userAttendanceMap.values());
}

/**
 * Get attendance summary for all users
 */
export async function getAttendanceSummary(
  startDate?: string,
  endDate?: string
): Promise<{
  total_users: number;
  total_days_tracked: number;
  total_full_days: number;
  total_half_days: number;
  total_days_off: number;
  total_incomplete_days: number;
  users: UserAttendance[];
}> {
  const users = await getAttendanceRecords(startDate, endDate);
  
  const summary = {
    total_users: users.length,
    total_days_tracked: users.reduce((sum, u) => sum + u.total_days, 0),
    total_full_days: users.reduce((sum, u) => sum + u.full_days, 0),
    total_half_days: users.reduce((sum, u) => sum + u.half_days, 0),
    total_days_off: users.reduce((sum, u) => sum + u.days_off, 0),
    total_incomplete_days: users.reduce((sum, u) => sum + u.incomplete_days, 0),
    users
  };
  
  return summary;
}

