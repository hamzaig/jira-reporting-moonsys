import { NextRequest, NextResponse } from 'next/server';
import { getTags, createTag, updateTag, deleteTag } from '@/lib/projects';

// GET all tags
export async function GET() {
  try {
    const tags = await getTags();
    return NextResponse.json({ success: true, tags });
  } catch (error: any) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags', details: error.message },
      { status: 500 }
    );
  }
}

// POST create new tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      );
    }

    const tag = await createTag(name, color);
    return NextResponse.json({ success: true, tag }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tag:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { error: 'Tag with this name already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create tag', details: error.message },
      { status: 500 }
    );
  }
}

// PUT update tag
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, color } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    await updateTag(id, { name, color });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating tag:', error);
    return NextResponse.json(
      { error: 'Failed to update tag', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE tag
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Tag ID is required' },
        { status: 400 }
      );
    }

    await deleteTag(parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting tag:', error);
    return NextResponse.json(
      { error: 'Failed to delete tag', details: error.message },
      { status: 500 }
    );
  }
}
