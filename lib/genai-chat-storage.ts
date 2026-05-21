import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface GenAIChatDB extends DBSchema {
  credentials: {
    key: string;
    value: string;
  };
}

const DB_NAME = 'acolyte-genai-chat';
const DB_VERSION = 1;
const CREDENTIALS_STORE = 'credentials';
const API_KEY_ID = 'apiKey';

let dbPromise: Promise<IDBPDatabase<GenAIChatDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<GenAIChatDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<GenAIChatDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(CREDENTIALS_STORE)) {
          db.createObjectStore(CREDENTIALS_STORE);
        }
      },
    });
  }

  return dbPromise;
};

export const genAIChatStorage = {
  async getApiKey(): Promise<string> {
    try {
      const db = await getDB();
      return (await db.get(CREDENTIALS_STORE, API_KEY_ID)) || '';
    } catch (error) {
      console.warn('Failed to load GenAI API key:', error);
      return '';
    }
  },

  async saveApiKey(apiKey: string): Promise<void> {
    try {
      const db = await getDB();
      await db.put(CREDENTIALS_STORE, apiKey, API_KEY_ID);
    } catch (error) {
      console.warn('Failed to save GenAI API key:', error);
    }
  },

  async deleteApiKey(): Promise<void> {
    try {
      const db = await getDB();
      await db.delete(CREDENTIALS_STORE, API_KEY_ID);
    } catch (error) {
      console.warn('Failed to delete GenAI API key:', error);
    }
  },
};
