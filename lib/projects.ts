import mysql from 'mysql2/promise';
import { getPool } from './db';
import slugify from 'slugify';

// ============ TYPES ============

export interface ProjectCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at?: string;
}

export interface ProjectTag {
  id: number;
  name: string;
  slug: string;
  color: string;
  created_at?: string;
}

export interface ProjectTechStack {
  id?: number;
  project_id?: number;
  tech_name: string;
  tech_icon_url?: string;
  category: 'frontend' | 'backend' | 'database' | 'devops' | 'other';
}

export interface ProjectTeamMember {
  id?: number;
  project_id?: number;
  member_name: string;
  role?: string;
  avatar_url?: string;
}

export interface ProjectFile {
  id: number;
  project_id: number;
  file_name: string;
  file_url: string;
  file_key: string;
  file_type?: string;
  file_size?: number;
  file_category: 'screenshot' | 'document' | 'video' | 'other';
  created_at?: string;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  description?: string;
  client_name?: string;
  client_logo_url?: string;
  category_id?: number;
  category?: ProjectCategory;
  status: 'completed' | 'ongoing' | 'archived';
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency: string;
  live_url?: string;
  github_url?: string;
  documentation_url?: string;
  featured: boolean;
  created_at?: string;
  updated_at?: string;
  tags?: ProjectTag[];
  tech_stack?: ProjectTechStack[];
  team_members?: ProjectTeamMember[];
  files?: ProjectFile[];
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  client_name?: string;
  client_logo_url?: string;
  category_id?: number;
  status?: 'completed' | 'ongoing' | 'archived';
  start_date?: string;
  end_date?: string;
  budget?: number;
  currency?: string;
  live_url?: string;
  github_url?: string;
  documentation_url?: string;
  featured?: boolean;
  tag_ids?: number[];
  tech_stack?: Omit<ProjectTechStack, 'id' | 'project_id'>[];
  team_members?: Omit<ProjectTeamMember, 'id' | 'project_id'>[];
}

export interface ProjectFilters {
  category_id?: number;
  tag_ids?: number[];
  status?: string;
  featured?: boolean;
  search?: string;
  year?: number;
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'title' | 'start_date' | 'budget';
  sort_order?: 'asc' | 'desc';
}

// ============ CATEGORIES ============

export async function getCategories(): Promise<ProjectCategory[]> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT * FROM project_categories ORDER BY name ASC'
    );
    return rows as ProjectCategory[];
  } finally {
    connection.release();
  }
}

export async function getCategoryById(id: number): Promise<ProjectCategory | null> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT * FROM project_categories WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as ProjectCategory) : null;
  } finally {
    connection.release();
  }
}

export async function createCategory(name: string, description?: string, color?: string): Promise<ProjectCategory> {
  const connection = await getPool().getConnection();
  try {
    const slug = slugify(name, { lower: true, strict: true });
    const [result] = await connection.query<mysql.ResultSetHeader>(
      'INSERT INTO project_categories (name, slug, description, color) VALUES (?, ?, ?, ?)',
      [name, slug, description || null, color || '#6366f1']
    );
    return {
      id: result.insertId,
      name,
      slug,
      description,
      color: color || '#6366f1',
    };
  } finally {
    connection.release();
  }
}

export async function updateCategory(id: number, data: Partial<ProjectCategory>): Promise<void> {
  const connection = await getPool().getConnection();
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name) {
      updates.push('name = ?', 'slug = ?');
      values.push(data.name, slugify(data.name, { lower: true, strict: true }));
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.color) {
      updates.push('color = ?');
      values.push(data.color);
    }
    
    if (updates.length > 0) {
      values.push(id);
      await connection.query(
        `UPDATE project_categories SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
  } finally {
    connection.release();
  }
}

export async function deleteCategory(id: number): Promise<void> {
  const connection = await getPool().getConnection();
  try {
    await connection.query('DELETE FROM project_categories WHERE id = ?', [id]);
  } finally {
    connection.release();
  }
}

// ============ TAGS ============

export async function getTags(): Promise<ProjectTag[]> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT * FROM project_tags ORDER BY name ASC'
    );
    return rows as ProjectTag[];
  } finally {
    connection.release();
  }
}

export async function getTagById(id: number): Promise<ProjectTag | null> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT * FROM project_tags WHERE id = ?',
      [id]
    );
    return rows.length > 0 ? (rows[0] as ProjectTag) : null;
  } finally {
    connection.release();
  }
}

export async function createTag(name: string, color?: string): Promise<ProjectTag> {
  const connection = await getPool().getConnection();
  try {
    const slug = slugify(name, { lower: true, strict: true });
    const [result] = await connection.query<mysql.ResultSetHeader>(
      'INSERT INTO project_tags (name, slug, color) VALUES (?, ?, ?)',
      [name, slug, color || '#10b981']
    );
    return {
      id: result.insertId,
      name,
      slug,
      color: color || '#10b981',
    };
  } finally {
    connection.release();
  }
}

export async function updateTag(id: number, data: Partial<ProjectTag>): Promise<void> {
  const connection = await getPool().getConnection();
  try {
    const updates: string[] = [];
    const values: any[] = [];
    
    if (data.name) {
      updates.push('name = ?', 'slug = ?');
      values.push(data.name, slugify(data.name, { lower: true, strict: true }));
    }
    if (data.color) {
      updates.push('color = ?');
      values.push(data.color);
    }
    
    if (updates.length > 0) {
      values.push(id);
      await connection.query(
        `UPDATE project_tags SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
  } finally {
    connection.release();
  }
}

export async function deleteTag(id: number): Promise<void> {
  const connection = await getPool().getConnection();
  try {
    await connection.query('DELETE FROM project_tags WHERE id = ?', [id]);
  } finally {
    connection.release();
  }
}

// ============ PROJECTS ============

export async function getProjects(filters: ProjectFilters = {}): Promise<{ projects: Project[]; total: number }> {
  const connection = await getPool().getConnection();
  try {
    let query = `
      SELECT p.*, pc.name as category_name, pc.slug as category_slug, pc.color as category_color
      FROM projects p
      LEFT JOIN project_categories pc ON p.category_id = pc.id
      WHERE 1=1
    `;
    const params: any[] = [];
    
    // Apply filters
    if (filters.category_id) {
      query += ' AND p.category_id = ?';
      params.push(filters.category_id);
    }
    
    if (filters.status) {
      query += ' AND p.status = ?';
      params.push(filters.status);
    }
    
    if (filters.featured !== undefined) {
      query += ' AND p.featured = ?';
      params.push(filters.featured);
    }
    
    if (filters.search) {
      query += ' AND (p.title LIKE ? OR p.description LIKE ? OR p.client_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (filters.year) {
      query += ' AND YEAR(p.start_date) = ?';
      params.push(filters.year);
    }
    
    // Tag filtering (requires subquery)
    if (filters.tag_ids && filters.tag_ids.length > 0) {
      query += ` AND p.id IN (
        SELECT project_id FROM project_tag_relations 
        WHERE tag_id IN (${filters.tag_ids.map(() => '?').join(',')})
      )`;
      params.push(...filters.tag_ids);
    }
    
    // Get total count
    const countQuery = query.replace(/SELECT p\.\*.*FROM/, 'SELECT COUNT(*) as total FROM');
    const [countResult] = await connection.query<mysql.RowDataPacket[]>(countQuery, params);
    const total = countResult[0]?.total || 0;
    
    // Apply sorting
    const sortBy = filters.sort_by || 'created_at';
    const sortOrder = filters.sort_order || 'desc';
    query += ` ORDER BY p.${sortBy} ${sortOrder.toUpperCase()}`;
    
    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [rows] = await connection.query<mysql.RowDataPacket[]>(query, params);
    
    // Map results and fetch related data
    const projects: Project[] = await Promise.all(
      rows.map(async (row) => {
        const project: Project = {
          ...row,
          category: row.category_id ? {
            id: row.category_id,
            name: row.category_name,
            slug: row.category_slug,
            color: row.category_color,
          } : undefined,
          featured: !!row.featured,
        } as Project;
        
        // Fetch tags
        project.tags = await getProjectTags(connection, row.id);
        
        return project;
      })
    );
    
    return { projects, total };
  } finally {
    connection.release();
  }
}

export async function getProjectById(id: number): Promise<Project | null> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      `SELECT p.*, pc.name as category_name, pc.slug as category_slug, pc.color as category_color
       FROM projects p
       LEFT JOIN project_categories pc ON p.category_id = pc.id
       WHERE p.id = ?`,
      [id]
    );
    
    if (rows.length === 0) return null;
    
    const row = rows[0];
    const project: Project = {
      ...row,
      category: row.category_id ? {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
        color: row.category_color,
      } : undefined,
      featured: !!row.featured,
    } as Project;
    
    // Fetch related data
    project.tags = await getProjectTags(connection, id);
    project.tech_stack = await getProjectTechStack(connection, id);
    project.team_members = await getProjectTeamMembers(connection, id);
    project.files = await getProjectFiles(connection, id);
    
    return project;
  } finally {
    connection.release();
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT id FROM projects WHERE slug = ?',
      [slug]
    );
    
    if (rows.length === 0) return null;
    
    connection.release();
    return await getProjectById(rows[0].id);
  } catch (error) {
    connection.release();
    throw error;
  }
}

export async function createProject(input: CreateProjectInput): Promise<Project> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    
    // Generate unique slug
    let slug = slugify(input.title, { lower: true, strict: true });
    const [existingSlugs] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT slug FROM projects WHERE slug LIKE ?',
      [`${slug}%`]
    );
    
    if (existingSlugs.length > 0) {
      slug = `${slug}-${Date.now()}`;
    }
    
    // Insert project
    const [result] = await connection.query<mysql.ResultSetHeader>(
      `INSERT INTO projects (
        title, slug, description, client_name, client_logo_url,
        category_id, status, start_date, end_date, budget, currency,
        live_url, github_url, documentation_url, featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.title,
        slug,
        input.description || null,
        input.client_name || null,
        input.client_logo_url || null,
        input.category_id || null,
        input.status || 'completed',
        input.start_date || null,
        input.end_date || null,
        input.budget || null,
        input.currency || 'PKR',
        input.live_url || null,
        input.github_url || null,
        input.documentation_url || null,
        input.featured || false,
      ]
    );
    
    const projectId = result.insertId;
    
    // Insert tag relations
    if (input.tag_ids && input.tag_ids.length > 0) {
      const tagValues = input.tag_ids.map(tagId => [projectId, tagId]);
      await connection.query(
        'INSERT INTO project_tag_relations (project_id, tag_id) VALUES ?',
        [tagValues]
      );
    }
    
    // Insert tech stack
    if (input.tech_stack && input.tech_stack.length > 0) {
      const techValues = input.tech_stack.map(tech => [
        projectId,
        tech.tech_name,
        tech.tech_icon_url || null,
        tech.category || 'other',
      ]);
      await connection.query(
        'INSERT INTO project_tech_stack (project_id, tech_name, tech_icon_url, category) VALUES ?',
        [techValues]
      );
    }
    
    // Insert team members
    if (input.team_members && input.team_members.length > 0) {
      const memberValues = input.team_members.map(member => [
        projectId,
        member.member_name,
        member.role || null,
        member.avatar_url || null,
      ]);
      await connection.query(
        'INSERT INTO project_team_members (project_id, member_name, role, avatar_url) VALUES ?',
        [memberValues]
      );
    }
    
    await connection.commit();
    
    connection.release();
    return (await getProjectById(projectId))!;
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

export async function updateProject(id: number, input: Partial<CreateProjectInput>): Promise<Project | null> {
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    
    // Build update query
    const updates: string[] = [];
    const values: any[] = [];
    
    if (input.title !== undefined) {
      updates.push('title = ?');
      values.push(input.title);
      updates.push('slug = ?');
      values.push(slugify(input.title, { lower: true, strict: true }) + '-' + id);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }
    if (input.client_name !== undefined) {
      updates.push('client_name = ?');
      values.push(input.client_name);
    }
    if (input.client_logo_url !== undefined) {
      updates.push('client_logo_url = ?');
      values.push(input.client_logo_url);
    }
    if (input.category_id !== undefined) {
      updates.push('category_id = ?');
      values.push(input.category_id);
    }
    if (input.status !== undefined) {
      updates.push('status = ?');
      values.push(input.status);
    }
    if (input.start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(input.start_date);
    }
    if (input.end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(input.end_date);
    }
    if (input.budget !== undefined) {
      updates.push('budget = ?');
      values.push(input.budget);
    }
    if (input.currency !== undefined) {
      updates.push('currency = ?');
      values.push(input.currency);
    }
    if (input.live_url !== undefined) {
      updates.push('live_url = ?');
      values.push(input.live_url);
    }
    if (input.github_url !== undefined) {
      updates.push('github_url = ?');
      values.push(input.github_url);
    }
    if (input.documentation_url !== undefined) {
      updates.push('documentation_url = ?');
      values.push(input.documentation_url);
    }
    if (input.featured !== undefined) {
      updates.push('featured = ?');
      values.push(input.featured);
    }
    
    if (updates.length > 0) {
      values.push(id);
      await connection.query(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
    
    // Update tag relations
    if (input.tag_ids !== undefined) {
      await connection.query('DELETE FROM project_tag_relations WHERE project_id = ?', [id]);
      if (input.tag_ids.length > 0) {
        const tagValues = input.tag_ids.map(tagId => [id, tagId]);
        await connection.query(
          'INSERT INTO project_tag_relations (project_id, tag_id) VALUES ?',
          [tagValues]
        );
      }
    }
    
    // Update tech stack
    if (input.tech_stack !== undefined) {
      await connection.query('DELETE FROM project_tech_stack WHERE project_id = ?', [id]);
      if (input.tech_stack.length > 0) {
        const techValues = input.tech_stack.map(tech => [
          id,
          tech.tech_name,
          tech.tech_icon_url || null,
          tech.category || 'other',
        ]);
        await connection.query(
          'INSERT INTO project_tech_stack (project_id, tech_name, tech_icon_url, category) VALUES ?',
          [techValues]
        );
      }
    }
    
    // Update team members
    if (input.team_members !== undefined) {
      await connection.query('DELETE FROM project_team_members WHERE project_id = ?', [id]);
      if (input.team_members.length > 0) {
        const memberValues = input.team_members.map(member => [
          id,
          member.member_name,
          member.role || null,
          member.avatar_url || null,
        ]);
        await connection.query(
          'INSERT INTO project_team_members (project_id, member_name, role, avatar_url) VALUES ?',
          [memberValues]
        );
      }
    }
    
    await connection.commit();
    
    connection.release();
    return await getProjectById(id);
  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
}

export async function deleteProject(id: number): Promise<void> {
  const connection = await getPool().getConnection();
  try {
    await connection.query('DELETE FROM projects WHERE id = ?', [id]);
  } finally {
    connection.release();
  }
}

// ============ PROJECT FILES ============

export async function addProjectFile(
  projectId: number,
  fileName: string,
  fileUrl: string,
  fileKey: string,
  fileType?: string,
  fileSize?: number,
  fileCategory: 'screenshot' | 'document' | 'video' | 'other' = 'other'
): Promise<ProjectFile> {
  const connection = await getPool().getConnection();
  try {
    const [result] = await connection.query<mysql.ResultSetHeader>(
      `INSERT INTO project_files (project_id, file_name, file_url, file_key, file_type, file_size, file_category)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [projectId, fileName, fileUrl, fileKey, fileType || null, fileSize || null, fileCategory]
    );
    
    return {
      id: result.insertId,
      project_id: projectId,
      file_name: fileName,
      file_url: fileUrl,
      file_key: fileKey,
      file_type: fileType,
      file_size: fileSize,
      file_category: fileCategory,
    };
  } finally {
    connection.release();
  }
}

export async function deleteProjectFile(fileId: number): Promise<string | null> {
  const connection = await getPool().getConnection();
  try {
    // Get file key first
    const [rows] = await connection.query<mysql.RowDataPacket[]>(
      'SELECT file_key FROM project_files WHERE id = ?',
      [fileId]
    );
    
    if (rows.length === 0) return null;
    
    const fileKey = rows[0].file_key;
    
    await connection.query('DELETE FROM project_files WHERE id = ?', [fileId]);
    
    return fileKey;
  } finally {
    connection.release();
  }
}

// ============ HELPER FUNCTIONS ============

async function getProjectTags(connection: mysql.PoolConnection, projectId: number): Promise<ProjectTag[]> {
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    `SELECT t.* FROM project_tags t
     INNER JOIN project_tag_relations ptr ON t.id = ptr.tag_id
     WHERE ptr.project_id = ?`,
    [projectId]
  );
  return rows as ProjectTag[];
}

async function getProjectTechStack(connection: mysql.PoolConnection, projectId: number): Promise<ProjectTechStack[]> {
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    'SELECT * FROM project_tech_stack WHERE project_id = ?',
    [projectId]
  );
  return rows as ProjectTechStack[];
}

async function getProjectTeamMembers(connection: mysql.PoolConnection, projectId: number): Promise<ProjectTeamMember[]> {
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    'SELECT * FROM project_team_members WHERE project_id = ?',
    [projectId]
  );
  return rows as ProjectTeamMember[];
}

async function getProjectFiles(connection: mysql.PoolConnection, projectId: number): Promise<ProjectFile[]> {
  const [rows] = await connection.query<mysql.RowDataPacket[]>(
    'SELECT * FROM project_files WHERE project_id = ? ORDER BY created_at DESC',
    [projectId]
  );
  return rows as ProjectFile[];
}

// ============ STATISTICS ============

export async function getProjectStats(): Promise<{
  total_projects: number;
  completed: number;
  ongoing: number;
  archived: number;
  total_clients: number;
}> {
  const connection = await getPool().getConnection();
  try {
    const [rows] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'ongoing' THEN 1 ELSE 0 END) as ongoing,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived,
        COUNT(DISTINCT client_name) as total_clients
      FROM projects
    `);
    
    return {
      total_projects: rows[0]?.total_projects || 0,
      completed: rows[0]?.completed || 0,
      ongoing: rows[0]?.ongoing || 0,
      archived: rows[0]?.archived || 0,
      total_clients: rows[0]?.total_clients || 0,
    };
  } finally {
    connection.release();
  }
}
