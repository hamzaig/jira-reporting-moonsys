import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl, deleteFile, isS3Configured } from '@/lib/s3';
import { addProjectFile, deleteProjectFile } from '@/lib/projects';

// POST - Get presigned URL for upload or save file metadata after upload
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    // Action: get_upload_url - Returns presigned URL for direct S3 upload
    if (action === 'get_upload_url') {
      if (!isS3Configured()) {
        return NextResponse.json(
          { error: 'S3 is not configured. Please set AWS credentials.' },
          { status: 500 }
        );
      }

      const { project_id, file_name, file_type, file_category } = body;

      if (!project_id || !file_name || !file_type) {
        return NextResponse.json(
          { error: 'project_id, file_name, and file_type are required' },
          { status: 400 }
        );
      }

      const result = await getPresignedUploadUrl(
        project_id,
        file_name,
        file_type,
        file_category || 'other'
      );

      return NextResponse.json({
        success: true,
        upload_url: result.uploadUrl,
        file_url: result.fileUrl,
        file_key: result.key,
      });
    }

    // Action: save_file - Save file metadata after successful upload
    if (action === 'save_file') {
      const { project_id, file_name, file_url, file_key, file_type, file_size, file_category } = body;

      if (!project_id || !file_name || !file_url || !file_key) {
        return NextResponse.json(
          { error: 'project_id, file_name, file_url, and file_key are required' },
          { status: 400 }
        );
      }

      const file = await addProjectFile(
        project_id,
        file_name,
        file_url,
        file_key,
        file_type,
        file_size,
        file_category || 'other'
      );

      return NextResponse.json({ success: true, file }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "get_upload_url" or "save_file"' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in files API:', error);
    return NextResponse.json(
      { error: 'File operation failed', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a file from S3 and database
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('id');

    if (!fileId) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    // Delete from database and get file key
    const fileKey = await deleteProjectFile(parseInt(fileId));

    if (!fileKey) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Delete from S3 if configured
    if (isS3Configured()) {
      try {
        await deleteFile(fileKey);
      } catch (s3Error) {
        console.error('S3 deletion error (non-fatal):', s3Error);
        // Continue even if S3 deletion fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', details: error.message },
      { status: 500 }
    );
  }
}
