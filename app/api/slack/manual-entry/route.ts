import { NextRequest, NextResponse } from 'next/server';
import { saveManualEntry, getUniqueUsers, deleteMessage } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_name, message_type, timestamp, message_text } = body;

    // Validation
    if (!user_name || !message_type || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: user_name, message_type, and timestamp are required' },
        { status: 400 }
      );
    }

    if (message_type !== 'checkin' && message_type !== 'checkout') {
      return NextResponse.json(
        { error: 'message_type must be either "checkin" or "checkout"' },
        { status: 400 }
      );
    }

    // Validate timestamp format (should be Unix timestamp in seconds as string)
    const timestampNum = parseFloat(timestamp);
    if (isNaN(timestampNum) || timestampNum <= 0) {
      return NextResponse.json(
        { error: 'Invalid timestamp format. Expected Unix timestamp in seconds.' },
        { status: 400 }
      );
    }

    console.log('📝 Saving manual entry:', {
      user_name,
      message_type,
      timestamp,
      message_text: message_text?.substring(0, 50)
    });

    await saveManualEntry(
      user_name,
      message_type,
      timestamp,
      message_text
    );

    return NextResponse.json({
      success: true,
      message: 'Manual entry saved successfully'
    });

  } catch (error: any) {
    console.error('❌ Error saving manual entry:', error);
    return NextResponse.json(
      { error: 'Failed to save manual entry', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    // Validation
    if (!id || typeof id !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid entry ID' },
        { status: 400 }
      );
    }

    console.log('🗑️ Deleting entry with ID:', id);

    const deleted = await deleteMessage(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Entry not found or could not be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Entry deleted successfully'
    });

  } catch (error: any) {
    console.error('❌ Error deleting entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const users = await getUniqueUsers();
    return NextResponse.json({
      success: true,
      users: users
    });
  } catch (error: any) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error.message },
      { status: 500 }
    );
  }
}
