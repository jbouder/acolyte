import { DBSchema, IDBPDatabase, openDB } from 'idb';

interface TabData {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: string;
  requestBody: string;
}

export interface APIProject {
  id: string;
  name: string;
  description?: string;
  tabs: TabData[];
  savedAt: string;
  lastModified: string;
}

interface APIProjectsDB extends DBSchema {
  projects: {
    key: string;
    value: APIProject;
  };
}

const DB_NAME = 'acolyte-api-projects';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

let dbPromise: Promise<IDBPDatabase<APIProjectsDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<APIProjectsDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<APIProjectsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

export const apiProjectsStorage = {
  async save(project: APIProject): Promise<void> {
    const db = await getDB();
    const now = new Date().toISOString();
    const projectToSave = {
      ...project,
      lastModified: now,
    };
    await db.put(STORE_NAME, projectToSave, project.id);
  },

  async load(projectId: string): Promise<APIProject | null> {
    try {
      const db = await getDB();
      const result = await db.get(STORE_NAME, projectId);
      return result || null;
    } catch (error) {
      console.warn('Failed to load project from IndexedDB:', error);
      return null;
    }
  },

  async list(): Promise<APIProject[]> {
    try {
      const db = await getDB();
      const projects = await db.getAll(STORE_NAME);
      // Sort by last modified date, newest first
      return projects.sort(
        (a, b) =>
          new Date(b.lastModified).getTime() -
          new Date(a.lastModified).getTime(),
      );
    } catch (error) {
      console.warn('Failed to list projects from IndexedDB:', error);
      return [];
    }
  },

  async delete(projectId: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, projectId);
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear(STORE_NAME);
  },

  // Helper function to create a new project from current tabs
  createProject(
    name: string,
    tabs: TabData[],
    description?: string,
  ): APIProject {
    const now = new Date().toISOString();
    return {
      id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      tabs: JSON.parse(JSON.stringify(tabs)), // Deep copy to avoid mutations
      savedAt: now,
      lastModified: now,
    };
  },
};
