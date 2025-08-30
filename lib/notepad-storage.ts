import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface NotepadDB extends DBSchema {
  notes: {
    key: string;
    value: {
      content: string;
      lastSaved: string;
    };
  };
}

const DB_NAME = 'acolyte-notepad';
const DB_VERSION = 1;
const STORE_NAME = 'notes';
const STORAGE_KEY = 'acolyte-notepad-content';

let dbPromise: Promise<IDBPDatabase<NotepadDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<NotepadDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<NotepadDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

export interface NotepadData {
  content: string;
  lastSaved: string;
}

export const notepadStorage = {
  async save(data: NotepadData): Promise<void> {
    const db = await getDB();
    await db.put(STORE_NAME, data, STORAGE_KEY);
  },

  async load(): Promise<NotepadData | null> {
    try {
      const db = await getDB();
      const result = await db.get(STORE_NAME, STORAGE_KEY);
      return result || null;
    } catch (error) {
      console.warn('Failed to load from IndexedDB:', error);
      return null;
    }
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, STORAGE_KEY);
  },

  // Migration function to move data from localStorage to IndexedDB
  async migrateFromLocalStorage(): Promise<boolean> {
    if (typeof localStorage === 'undefined') return false;

    const localData = localStorage.getItem(STORAGE_KEY);
    if (!localData) return false;

    try {
      let migrationData: NotepadData;

      try {
        const parsed = JSON.parse(localData);
        migrationData = {
          content: parsed.content || '',
          lastSaved: parsed.lastSaved || new Date().toISOString(),
        };
      } catch {
        // Handle legacy string format
        migrationData = {
          content: localData,
          lastSaved: new Date().toISOString(),
        };
      }

      // Check if IndexedDB already has data
      const existingData = await this.load();
      if (existingData) {
        return false; // Don't overwrite existing IndexedDB data
      }

      // Save to IndexedDB
      await this.save(migrationData);

      // Remove from localStorage after successful migration
      localStorage.removeItem(STORAGE_KEY);

      return true;
    } catch (error) {
      console.warn('Failed to migrate from localStorage:', error);
      return false;
    }
  },
};
