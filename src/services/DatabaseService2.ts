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
      console.log('SQLite object:', typeof SQLite);
      
      // Reset state
      this.isInitialized = false;
      this.db = null;
      
      // Try different approaches based on available methods
      if (SQLite.openDatabaseAsync) {
        console.log('Using openDatabaseAsync...');
        this.db = await SQLite.openDatabaseAsync('virtue_tracker.db');
      } else if (SQLite.openDatabase) {
        console.log('Using legacy openDatabase...');
        this.db = SQLite.openDatabase('virtue_tracker.db');
      } else {
        throw new Error('No suitable database opening method found');
      }
      
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
      // Use execAsync if available, otherwise fallback to exec
      const execMethod = this.db.execAsync || this.db.exec;
      
      if (this.db.execAsync) {
        console.log('Using execAsync for table creation');
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
      } else {
        console.log('Using legacy exec for table creation');
        // Fallback for older versions
        await new Promise((resolve, reject) => {
          this.db.transaction(tx => {
            tx.executeSql(`
              CREATE TABLE IF NOT EXISTS activities (
                id TEXT PRIMARY KEY,
                handle TEXT NOT NULL,
                committed_on TEXT NOT NULL,
                tags TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
              );
            `, [], resolve, reject);
          });
        });
      }
      
      console.log('Database tables and indexes created successfully');
    } catch (error) {
      console.error('Error creating tables:', error);
      throw error;
    }
  }

  // Test method to verify database is working
  async testDatabase(): Promise<boolean> {
    try {
      this.ensureInitialized();
      
      // Try a simple query
      if (this.db!.getAllAsync) {
        const result = await this.db!.getAllAsync('SELECT name FROM sqlite_master WHERE type="table"');
        console.log('Database test successful. Tables found:', result);
      } else {
        console.log('Using legacy query method for test');
        // Legacy test
        return true;
      }
      return true;
    } catch (error) {
      console.error('Database test failed:', error);
      return false;
    }
  }

  async addActivity(activity: NewActivity): Promise<Activity> {
    this.ensureInitialized();

    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();
    const tagsJson = JSON.stringify(activity.tags);

    if (this.db!.runAsync) {
      await this.db!.runAsync(
        `INSERT INTO activities (id, handle, committed_on, tags, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, activity.handle, activity.committed_on, tagsJson, now, now]
      );
    } else {
      // Legacy fallback
      await new Promise((resolve, reject) => {
        this.db!.transaction(tx => {
          tx.executeSql(
            `INSERT INTO activities (id, handle, committed_on, tags, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id, activity.handle, activity.committed_on, tagsJson, now, now],
            resolve,
            reject
          );
        });
      });
    }

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

    let result: any[];
    
    if (this.db!.getAllAsync) {
      result = await this.db!.getAllAsync(
        'SELECT * FROM activities ORDER BY committed_on DESC, created_at DESC'
      );
    } else {
      // Legacy fallback
      result = await new Promise((resolve, reject) => {
        this.db!.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM activities ORDER BY committed_on DESC, created_at DESC',
            [],
            (_, { rows }) => resolve(rows._array),
            reject
          );
        });
      });
    }

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

    let result: any[];
    
    if (this.db!.getAllAsync) {
      result = await this.db!.getAllAsync(
        `SELECT * FROM activities 
         WHERE committed_on >= ? AND committed_on <= ?
         ORDER BY committed_on DESC, created_at DESC`,
        [startDate, endDate]
      );
    } else {
      // Legacy fallback
      result = await new Promise((resolve, reject) => {
        this.db!.transaction(tx => {
          tx.executeSql(
            `SELECT * FROM activities 
             WHERE committed_on >= ? AND committed_on <= ?
             ORDER BY committed_on DESC, created_at DESC`,
            [startDate, endDate],
            (_, { rows }) => resolve(rows._array),
            reject
          );
        });
      });
    }

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

    let result: any;
    
    if (this.db!.getFirstAsync) {
      result = await this.db!.getFirstAsync(
        'SELECT * FROM activities WHERE id = ?',
        [id]
      );
    } else {
      // Legacy fallback
      const results = await new Promise((resolve, reject) => {
        this.db!.transaction(tx => {
          tx.executeSql(
            'SELECT * FROM activities WHERE id = ?',
            [id],
            (_, { rows }) => resolve(rows._array),
            reject
          );
        });
      });
      result = (results as any[])[0] || null;
    }

    if (!result) return null;

    return {
      id: result.id,
      handle: result.handle,
      committed_on: result.committed_on,
      tags: JSON.parse(result.tags),
      created_at: result.created_at,
      updated_at: result.updated_at,
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

    if (this.db!.runAsync) {
      await this.db!.runAsync(
        `UPDATE activities 
         SET handle = ?, committed_on = ?, tags = ?, updated_at = ?
         WHERE id = ?`,
        [updated.handle, updated.committed_on, tagsJson, updated.updated_at, id]
      );
    } else {
      // Legacy fallback
      await new Promise((resolve, reject) => {
        this.db!.transaction(tx => {
          tx.executeSql(
            `UPDATE activities 
             SET handle = ?, committed_on = ?, tags = ?, updated_at = ?
             WHERE id = ?`,
            [updated.handle, updated.committed_on, tagsJson, updated.updated_at, id],
            resolve,
            reject
          );
        });
      });
    }

    return updated;
  }

  async deleteActivity(id: string): Promise<boolean> {
    this.ensureInitialized();

    if (this.db!.runAsync) {
      const result = await this.db!.runAsync(
        'DELETE FROM activities WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } else {
      // Legacy fallback
      return new Promise((resolve, reject) => {
        this.db!.transaction(tx => {
          tx.executeSql(
            'DELETE FROM activities WHERE id = ?',
            [id],
            (_, result) => resolve(result.rowsAffected > 0),
            reject
          );
        });
      });
    }
  }

  async getAllTags(): Promise<string[]> {
    this.ensureInitialized();

    let result: any[];
    
    if (this.db!.getAllAsync) {
      result = await this.db!.getAllAsync('SELECT DISTINCT tags FROM activities');
    } else {
      // Legacy fallback
      result = await new Promise((resolve, reject) => {
        this.db!.transaction(tx => {
          tx.executeSql(
            'SELECT DISTINCT tags FROM activities',
            [],
            (_, { rows }) => resolve(rows._array),
            reject
          );
        });
      });
    }
    
    const allTags = new Set<string>();
    result.forEach((row: any) => {
      const tags = JSON.parse(row.tags);
      tags.forEach((tag: string) => allTags.add(tag));
    });

    return Array.from(allTags).sort();
  }
}

export const databaseService = new DatabaseService();
