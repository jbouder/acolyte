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
  settings: {
    key: string;
    value: string;
  };
}

const DB_NAME = 'acolyte-api-projects';
const DB_VERSION = 1;
const PROJECTS_STORE = 'projects';
const SETTINGS_STORE = 'settings';
const CURRENT_PROJECT_KEY = 'currentProject';

let dbPromise: Promise<IDBPDatabase<APIProjectsDB>> | null = null;

const getDB = (): Promise<IDBPDatabase<APIProjectsDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<APIProjectsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
          db.createObjectStore(PROJECTS_STORE);
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE);
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
    await db.put(PROJECTS_STORE, projectToSave, project.id);
  },

  async load(projectId: string): Promise<APIProject | null> {
    try {
      const db = await getDB();
      const result = await db.get(PROJECTS_STORE, projectId);
      return result || null;
    } catch (error) {
      console.warn('Failed to load project from IndexedDB:', error);
      return null;
    }
  },

  async list(): Promise<APIProject[]> {
    try {
      const db = await getDB();
      const projects = await db.getAll(PROJECTS_STORE);
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
    await db.delete(PROJECTS_STORE, projectId);

    // If this was the current project, clear it
    const currentProjectId = await this.getCurrentProjectId();
    if (currentProjectId === projectId) {
      await this.setCurrentProjectId(null);
    }
  },

  async clear(): Promise<void> {
    const db = await getDB();
    await db.clear(PROJECTS_STORE);
    await this.setCurrentProjectId(null);
  },

  // Current project management
  async getCurrentProjectId(): Promise<string | null> {
    try {
      const db = await getDB();
      const result = await db.get(SETTINGS_STORE, CURRENT_PROJECT_KEY);
      return result || null;
    } catch (error) {
      console.warn('Failed to get current project ID:', error);
      return null;
    }
  },

  async setCurrentProjectId(projectId: string | null): Promise<void> {
    try {
      const db = await getDB();
      if (projectId) {
        await db.put(SETTINGS_STORE, projectId, CURRENT_PROJECT_KEY);
      } else {
        await db.delete(SETTINGS_STORE, CURRENT_PROJECT_KEY);
      }
    } catch (error) {
      console.warn('Failed to set current project ID:', error);
    }
  },

  async getCurrentProject(): Promise<APIProject | null> {
    const currentProjectId = await this.getCurrentProjectId();
    if (!currentProjectId) return null;
    return await this.load(currentProjectId);
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

  // Helper function to update an existing project with new tabs
  updateProject(
    project: APIProject,
    tabs: TabData[],
    name?: string,
    description?: string,
  ): APIProject {
    const now = new Date().toISOString();
    return {
      ...project,
      name: name || project.name,
      description:
        description !== undefined ? description : project.description,
      tabs: JSON.parse(JSON.stringify(tabs)), // Deep copy to avoid mutations
      lastModified: now,
    };
  },
};
