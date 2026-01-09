import { NextRequest, NextResponse } from 'next/server';
import { getAttendanceSummary } from '@/lib/attendance';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const summary = getAttendanceSummary(
      startDate || undefined,
      endDate || undefined
    );
    
    return NextResponse.json({
      success: true,
      ...summary
    });
    
  } catch (error: any) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance', details: error.message },
      { status: 500 }
    );
  }
}

