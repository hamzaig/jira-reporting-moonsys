import { getCheckInOutMessages, SlackMessage } from './db';

const TIMEZONE = 'Asia/Karachi';
const FULL_DAY_HOURS = 6; // 6 hours = full day
const HALF_DAY_HOURS = 3; // Less than 6 but more than 3 = half day

export interface AttendanceRecord {
  date: string;
  user_id: string;
  user_name: string;
  check_in_time: string | null;
  check_out_time: string | null;
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
 * Get attendance records for a date range
 */
export function getAttendanceRecords(
  startDate?: string,
  endDate?: string
): UserAttendance[] {
  // Get all check-in/check-out messages
  const messages = getCheckInOutMessages(startDate, endDate);
  
  // Group messages by user and date
  const userDateMap = new Map<string, Map<string, { checkins: SlackMessage[], checkouts: SlackMessage[] }>>();
  
  messages.forEach(message => {
    const date = getDateInKarachi(message.timestamp);
    const userKey = message.user_id;
    const userName = message.user_name || message.user_id;
    
    if (!userDateMap.has(userKey)) {
      userDateMap.set(userKey, new Map());
    }
    
    const dateMap = userDateMap.get(userKey)!;
    if (!dateMap.has(date)) {
      dateMap.set(date, { checkins: [], checkouts: [] });
    }
    
    const dayData = dateMap.get(date)!;
    
    if (message.message_type === 'checkin') {
      dayData.checkins.push(message);
    } else if (message.message_type === 'checkout') {
      dayData.checkouts.push(message);
    }
  });
  
  // Convert to attendance records
  const userAttendanceMap = new Map<string, UserAttendance>();
  
  userDateMap.forEach((dateMap, userId) => {
    const records: AttendanceRecord[] = [];
    let fullDays = 0;
    let halfDays = 0;
    let daysOff = 0;
    let incompleteDays = 0;
    
    dateMap.forEach((dayData, date) => {
      // Sort check-ins and check-outs by time
      dayData.checkins.sort((a, b) => parseFloat(a.timestamp) - parseFloat(b.timestamp));
      dayData.checkouts.sort((a, b) => parseFloat(a.timestamp) - parseFloat(b.timestamp));
      
      const firstCheckIn = dayData.checkins[0];
      const lastCheckOut = dayData.checkouts[dayData.checkouts.length - 1];
      
      let record: AttendanceRecord;
      const userName = firstCheckIn?.user_name || lastCheckOut?.user_name || userId;
      
      // Edge case: No check-in but has check-out
      if (!firstCheckIn && lastCheckOut) {
        record = {
          date,
          user_id: userId,
          user_name: userName,
          check_in_time: null,
          check_out_time: getTimeInKarachi(lastCheckOut.timestamp),
          work_duration_hours: 0,
          status: 'missing_checkin',
          notes: ['Check-in missing but check-out recorded']
        };
        incompleteDays++;
      }
      // Edge case: Has check-in but no check-out
      else if (firstCheckIn && !lastCheckOut) {
        record = {
          date,
          user_id: userId,
          user_name: userName,
          check_in_time: getTimeInKarachi(firstCheckIn.timestamp),
          check_out_time: null,
          work_duration_hours: 0,
          status: 'missing_checkout',
          notes: ['Check-out missing but check-in recorded']
        };
        incompleteDays++;
      }
      // Edge case: No check-in and no check-out (day off)
      else if (!firstCheckIn && !lastCheckOut) {
        // This shouldn't happen as we only process check-in/check-out messages
        // But handle it anyway
        return;
      }
      // Normal case: Has both check-in and check-out
      else {
        const workHours = calculateHours(firstCheckIn.timestamp, lastCheckOut.timestamp);
        
        let status: AttendanceRecord['status'];
        const notes: string[] = [];
        
        if (workHours < HALF_DAY_HOURS) {
          status = 'day_off';
          daysOff++;
          notes.push(`Worked only ${workHours} hours`);
        } else if (workHours < FULL_DAY_HOURS) {
          status = 'half_day';
          halfDays++;
          notes.push(`Worked ${workHours} hours (less than ${FULL_DAY_HOURS} hours)`);
        } else {
          status = 'full_day';
          fullDays++;
          notes.push(`Worked ${workHours} hours`);
        }
        
        // Check for multiple check-ins/check-outs
        if (dayData.checkins.length > 1) {
          notes.push(`Multiple check-ins (${dayData.checkins.length})`);
        }
        if (dayData.checkouts.length > 1) {
          notes.push(`Multiple check-outs (${dayData.checkouts.length})`);
        }
        
        record = {
          date,
          user_id: userId,
          user_name: userName,
          check_in_time: getTimeInKarachi(firstCheckIn.timestamp),
          check_out_time: getTimeInKarachi(lastCheckOut.timestamp),
          work_duration_hours: workHours,
          status,
          notes
        };
      }
      
      records.push(record);
    });
    
    // Sort records by date (newest first)
    records.sort((a, b) => b.date.localeCompare(a.date));
    
    const userName = records[0]?.user_name || userId;
    
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
export function getAttendanceSummary(
  startDate?: string,
  endDate?: string
): {
  total_users: number;
  total_days_tracked: number;
  total_full_days: number;
  total_half_days: number;
  total_days_off: number;
  total_incomplete_days: number;
  users: UserAttendance[];
} {
  const users = getAttendanceRecords(startDate, endDate);
  
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

