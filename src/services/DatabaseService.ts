import * as SQLite from 'expo-sqlite';
import { Activity, NewActivity } from '../types/Activity';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized: boolean = false;

  async initialize() {
    if (this.isInitialized && this.db) {
      console.log('Database already initialized');
      return; // Already initialized
    }

    try {
      console.log('Starting database initialization...');
      
      // Reset state
      this.isInitialized = false;
      this.db = null;
      
      // Open database
      console.log('Opening database: virtue_tracker.db');
      this.db = await SQLite.openDatabaseAsync('virtue_tracker.db');
      console.log('Database opened successfully:', !!this.db);
      
      if (!this.db) {
        throw new Error('Failed to open database - db is null');
      }
      
      // Create tables
      console.log('Creating tables...');
      await this.createTables();
      console.log('Tables created successfully');
      
      // Mark as initialized
      this.isInitialized = true;
      console.log('Database initialization completed successfully');
      
    } catch (error) {
      console.error('Database initialization error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      // Reset state on error
      this.db = null;
      this.isInitialized = false;
      throw error;
    }
  }

  private ensureInitialized() {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized. Please wait for initialization to complete.');
    }
  }

  private async createTables() {
    if (!this.db) {
      throw new Error('Database not open');
    }

    try {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS activities (
          id TEXT PRIMARY KEY,
          handle TEXT NOT NULL,
          committed_on TEXT NOT NULL,
          tags TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);

      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_activities_committed_on 
        ON activities(committed_on);
      `);

      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_activities_handle 
        ON activities(handle);
      `);
      
      console.log('Database tables and indexes created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  async addActivity(activity: NewActivity): Promise<Activity> {
    this.ensureInitialized();

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const tagsJson = JSON.stringify(activity.tags);

    await this.db!.runAsync(
      `INSERT INTO activities (id, handle, committed_on, tags, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, activity.handle, activity.committed_on, tagsJson, now, now]
    );

    return {
      id,
      handle: activity.handle,
      committed_on: activity.committed_on,
      tags: activity.tags,
      created_at: now,
      updated_at: now,
    };
  }

  async getActivities(): Promise<Activity[]> {
    this.ensureInitialized();

    const result = await this.db!.getAllAsync(
      'SELECT * FROM activities ORDER BY committed_on DESC, created_at DESC'
    );

    return result.map((row: any) => ({
      id: row.id,
      handle: row.handle,
      committed_on: row.committed_on,
      tags: JSON.parse(row.tags),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async getActivitiesByDateRange(startDate: string, endDate: string): Promise<Activity[]> {
    this.ensureInitialized();

    const result = await this.db!.getAllAsync(
      `SELECT * FROM activities 
       WHERE committed_on >= ? AND committed_on <= ?
       ORDER BY committed_on DESC, created_at DESC`,
      [startDate, endDate]
    );

    return result.map((row: any) => ({
      id: row.id,
      handle: row.handle,
      committed_on: row.committed_on,
      tags: JSON.parse(row.tags),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  async getActivityById(id: string): Promise<Activity | null> {
    this.ensureInitialized();

    const result = await this.db!.getFirstAsync(
      'SELECT * FROM activities WHERE id = ?',
      [id]
    );

    if (!result) return null;

    return {
      id: (result as any).id,
      handle: (result as any).handle,
      committed_on: (result as any).committed_on,
      tags: JSON.parse((result as any).tags),
      created_at: (result as any).created_at,
      updated_at: (result as any).updated_at,
    };
  }

  async updateActivity(id: string, updates: Partial<NewActivity>): Promise<Activity | null> {
    this.ensureInitialized();

    const existing = await this.getActivityById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    if (updates.tags) {
      updated.tags = updates.tags;
    }

    const tagsJson = JSON.stringify(updated.tags);

    await this.db!.runAsync(
      `UPDATE activities 
       SET handle = ?, committed_on = ?, tags = ?, updated_at = ?
       WHERE id = ?`,
      [updated.handle, updated.committed_on, tagsJson, updated.updated_at, id]
    );

    return updated;
  }

  async deleteActivity(id: string): Promise<boolean> {
    this.ensureInitialized();

    const result = await this.db!.runAsync(
      'DELETE FROM activities WHERE id = ?',
      [id]
    );

    return result.changes > 0;
  }

  async getAllTags(): Promise<string[]> {
    this.ensureInitialized();

    const result = await this.db!.getAllAsync('SELECT DISTINCT tags FROM activities');
    
    const allTags = new Set<string>();
    result.forEach((row: any) => {
      const tags = JSON.parse(row.tags);
      tags.forEach((tag: string) => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  }

  // Test method to verify database is working
  async testDatabase(): Promise<boolean> {
    try {
      this.ensureInitialized();
      
      // Try a simple query
      const result = await this.db!.getAllAsync('SELECT name FROM sqlite_master WHERE type="table"');
      console.log('Database test successful. Tables found:', result);
      return true;
    } catch (error) {
      console.error('Database test failed:', error);
      return false;
    }
  }
}

export const databaseService = new DatabaseService();
