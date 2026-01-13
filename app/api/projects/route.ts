import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject, getProjectStats, ProjectFilters } from '@/lib/projects';

// GET all projects with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Check if stats are requested
    if (searchParams.get('stats') === 'true') {
      const stats = await getProjectStats();
      return NextResponse.json({ success: true, ...stats });
    }
    
    // Parse filters
    const filters: ProjectFilters = {
      category_id: searchParams.get('category_id') ? parseInt(searchParams.get('category_id')!) : undefined,
      tag_ids: searchParams.get('tag_ids') ? searchParams.get('tag_ids')!.split(',').map(Number) : undefined,
      status: searchParams.get('status') || undefined,
      featured: searchParams.get('featured') ? searchParams.get('featured') === 'true' : undefined,
      search: searchParams.get('search') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
      sort_by: (searchParams.get('sort_by') as ProjectFilters['sort_by']) || 'created_at',
      sort_order: (searchParams.get('sort_order') as ProjectFilters['sort_order']) || 'desc',
    };
    
    const { projects, total } = await getProjects(filters);
    
    return NextResponse.json({
      success: true,
      projects,
      total,
      page: filters.page,
      limit: filters.limit,
      total_pages: Math.ceil(total / filters.limit!),
    });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error.message },
      { status: 500 }
    );
  }
}

// POST create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.title) {
      return NextResponse.json(
        { error: 'Project title is required' },
        { status: 400 }
      );
    }
    
    const project = await createProject(body);
    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project', details: error.message },
      { status: 500 }
    );
  }
}
