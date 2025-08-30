import '@testing-library/jest-dom';
import { apiProjectsStorage, APIProject } from '../lib/api-projects-storage';

// Mock IndexedDB using fake-indexeddb
import 'fake-indexeddb/auto';

describe('apiProjectsStorage', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await apiProjectsStorage.clear();
  });

  const mockTabData = [
    {
      id: '1',
      name: 'Test Request 1',
      url: 'https://api.example.com/test1',
      method: 'GET',
      headers: 'Content-Type: application/json',
      requestBody: '',
    },
    {
      id: '2',
      name: 'Test Request 2',
      url: 'https://api.example.com/test2',
      method: 'POST',
      headers: 'Content-Type: application/json\nAuthorization: Bearer token',
      requestBody: '{"test": "data"}',
    },
  ];

  it('creates a new project with proper structure', () => {
    const project = apiProjectsStorage.createProject(
      'Test Project',
      mockTabData,
      'Test description'
    );

    expect(project).toEqual({
      id: expect.stringMatching(/^project-\d+-[a-z0-9]+$/),
      name: 'Test Project',
      description: 'Test description',
      tabs: mockTabData,
      savedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      lastModified: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
    });
  });

  it('saves and loads a project successfully', async () => {
    const project = apiProjectsStorage.createProject(
      'Test Project',
      mockTabData,
      'Test description'
    );

    await apiProjectsStorage.save(project);
    const loadedProject = await apiProjectsStorage.load(project.id);

    expect(loadedProject).toMatchObject({
      id: project.id,
      name: project.name,
      description: project.description,
      tabs: project.tabs,
      savedAt: project.savedAt,
    });
    expect(loadedProject?.lastModified).toBeDefined();
  });

  it('returns null when loading non-existent project', async () => {
    const result = await apiProjectsStorage.load('non-existent-id');
    expect(result).toBeNull();
  });

  it('lists projects sorted by last modified date', async () => {
    const project1 = apiProjectsStorage.createProject('Project 1', mockTabData);
    const project2 = apiProjectsStorage.createProject('Project 2', mockTabData);
    
    await apiProjectsStorage.save(project1);
    
    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await apiProjectsStorage.save(project2);

    const projects = await apiProjectsStorage.list();
    
    expect(projects).toHaveLength(2);
    expect(projects[0].name).toBe('Project 2'); // More recent should be first
    expect(projects[1].name).toBe('Project 1');
  });

  it('deletes a project successfully', async () => {
    const project = apiProjectsStorage.createProject('Test Project', mockTabData);
    
    await apiProjectsStorage.save(project);
    expect(await apiProjectsStorage.load(project.id)).not.toBeNull();
    
    await apiProjectsStorage.delete(project.id);
    expect(await apiProjectsStorage.load(project.id)).toBeNull();
  });

  it('updates lastModified when saving existing project', async () => {
    const project = apiProjectsStorage.createProject('Test Project', mockTabData);
    const originalLastModified = project.lastModified;
    
    await apiProjectsStorage.save(project);
    
    // Wait a bit to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Save again
    await apiProjectsStorage.save(project);
    
    const loadedProject = await apiProjectsStorage.load(project.id);
    expect(loadedProject?.lastModified).not.toBe(originalLastModified);
  });

  it('clears all projects', async () => {
    const project1 = apiProjectsStorage.createProject('Project 1', mockTabData);
    const project2 = apiProjectsStorage.createProject('Project 2', mockTabData);
    
    await apiProjectsStorage.save(project1);
    await apiProjectsStorage.save(project2);
    
    expect(await apiProjectsStorage.list()).toHaveLength(2);
    
    await apiProjectsStorage.clear();
    
    expect(await apiProjectsStorage.list()).toHaveLength(0);
  });

  it('handles empty tabs array', () => {
    const project = apiProjectsStorage.createProject('Empty Project', []);
    
    expect(project.tabs).toEqual([]);
    expect(project.name).toBe('Empty Project');
  });

  it('creates copies of tabs to avoid mutations', () => {
    const originalTab = {
      id: '1',
      name: 'Test Request 1',
      url: 'https://api.example.com/test1',
      method: 'GET',
      headers: 'Content-Type: application/json',
      requestBody: '',
    };
    const tabsArray = [originalTab];
    const project = apiProjectsStorage.createProject('Test Project', tabsArray);
    
    // Modify the original tab object
    originalTab.name = 'Modified Name';
    
    // Project should still have original data (deep copy should protect against mutations)
    expect(project.tabs[0].name).toBe('Test Request 1');
    expect(originalTab.name).toBe('Modified Name');
  });
});