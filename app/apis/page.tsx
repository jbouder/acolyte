'use client';

import { ApiRequestForm } from '@/components/api-request-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { APIProject, apiProjectsStorage } from '@/lib/api-projects-storage';
import { FolderOpen, Plus, Save, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface TabData {
  id: string;
  name: string;
  url: string;
  method: string;
  headers: string;
  requestBody: string;
}

export default function BasicAPIsPage() {
  const [tabs, setTabs] = useState<TabData[]>([
    {
      id: '1',
      name: 'Request 1',
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
      headers: 'Content-Type: application/json',
      requestBody: '',
    },
  ]);
  const [activeTab, setActiveTab] = useState('1');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabName, setEditingTabName] = useState<string>('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // Project management state
  const [savedProjects, setSavedProjects] = useState<APIProject[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const addNewTab = () => {
    const newId = Date.now().toString(); // Use timestamp for unique ID
    const newTab: TabData = {
      id: newId,
      name: `Request ${tabs.length + 1}`,
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
      headers: 'Content-Type: application/json',
      requestBody: '',
    };
    setTabs((prevTabs) => [...prevTabs, newTab]);
    setActiveTab(newId);
  };

  const removeTab = (id: string) => {
    setTabs((prevTabs) => {
      if (prevTabs.length <= 1) return prevTabs; // Don't allow removing the last tab

      const newTabs = prevTabs.filter((tab) => tab.id !== id);

      // If we're removing the active tab, switch to the first tab
      setActiveTab((prevActiveTab) =>
        prevActiveTab === id ? newTabs[0].id : prevActiveTab,
      );

      return newTabs;
    });
  };

  const updateTabData = (id: string, updates: Partial<Omit<TabData, 'id'>>) => {
    setTabs((prevTabs) => {
      const newTabs = prevTabs.map((tab) =>
        tab.id === id ? { ...tab, ...updates } : tab,
      );
      return newTabs;
    });
  };

  const startEditingTab = (id: string, currentName: string) => {
    setEditingTabId(id);
    setEditingTabName(currentName);
  };

  const saveTabName = (id: string) => {
    if (editingTabName.trim()) {
      updateTabData(id, { name: editingTabName.trim() });
    }
    setEditingTabId(null);
    setEditingTabName('');
  };

  const cancelEditingTab = () => {
    setEditingTabId(null);
    setEditingTabName('');
  };

  // Focus the input when editing starts
  useEffect(() => {
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTabId]);

  // Load saved projects on component mount
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projects = await apiProjectsStorage.list();
        setSavedProjects(projects);
      } catch (error) {
        console.warn('Failed to load projects:', error);
        toast.error('Failed to load saved projects');
      }
    };
    loadProjects();
  }, []);

  // Project management functions
  const saveCurrentProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    try {
      const project = apiProjectsStorage.createProject(
        newProjectName.trim(),
        tabs,
        newProjectDescription.trim() || undefined,
      );

      await apiProjectsStorage.save(project);

      // Update the projects list
      const updatedProjects = await apiProjectsStorage.list();
      setSavedProjects(updatedProjects);

      // Reset dialog state
      setNewProjectName('');
      setNewProjectDescription('');
      setSaveDialogOpen(false);

      toast.success(`Project "${project.name}" saved successfully!`);
    } catch (error) {
      console.error('Failed to save project:', error);
      toast.error('Failed to save project');
    }
  };

  const loadProject = async (projectId: string) => {
    try {
      const project = await apiProjectsStorage.load(projectId);
      if (!project) {
        toast.error('Project not found');
        return;
      }

      // Replace current tabs with project tabs
      setTabs(project.tabs);
      setActiveTab(project.tabs[0]?.id || '1');
      setLoadDialogOpen(false);

      toast.success(`Project "${project.name}" loaded successfully!`);
    } catch (error) {
      console.error('Failed to load project:', error);
      toast.error('Failed to load project');
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const project = savedProjects.find((p) => p.id === projectId);
      await apiProjectsStorage.delete(projectId);

      // Update the projects list
      const updatedProjects = await apiProjectsStorage.list();
      setSavedProjects(updatedProjects);

      toast.success(`Project "${project?.name}" deleted successfully!`);
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">APIs</h1>

        {/* Project Management Controls */}
        <div className="flex items-center gap-2">
          {/* Save Project Dialog */}
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save API Project</DialogTitle>
                <DialogDescription>
                  Save your current API configuration as a project for later
                  use.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="project-name"
                    className="text-sm font-medium mb-2 block"
                  >
                    Project Name *
                  </label>
                  <Input
                    id="project-name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="project-description"
                    className="text-sm font-medium mb-2 block"
                  >
                    Description (optional)
                  </label>
                  <Input
                    id="project-description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setSaveDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveCurrentProject}>Save Project</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Load Project Dialog */}
          <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <FolderOpen className="h-4 w-4 mr-2" />
                Load Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Load API Project</DialogTitle>
                <DialogDescription>
                  Select a saved project to load. This will replace your current
                  tabs.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {savedProjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No saved projects found. Save your current configuration as
                    a project first.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {savedProjects.map((project) => (
                      <div
                        key={project.id}
                        className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{project.name}</h4>
                          {project.description && (
                            <p className="text-sm text-muted-foreground">
                              {project.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {project.tabs.length} tabs • Saved{' '}
                            {new Date(project.savedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => loadProject(project.id)}
                          >
                            Load
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteProject(project.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setLoadDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center gap-2 mb-4">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="relative group"
              >
                {editingTabId === tab.id ? (
                  <Input
                    ref={editInputRef}
                    value={editingTabName}
                    onChange={(e) => setEditingTabName(e.target.value)}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') {
                        saveTabName(tab.id);
                      } else if (e.key === 'Escape') {
                        cancelEditingTab();
                      }
                    }}
                    onBlur={() => saveTabName(tab.id)}
                    className="h-6 text-xs border-none p-1 min-w-[80px] bg-transparent"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="mr-2 cursor-pointer"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEditingTab(tab.id, tab.name);
                    }}
                    title="Double-click to edit name"
                  >
                    {tab.name}
                  </span>
                )}
                {tabs.length > 1 && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTab(tab.id);
                    }}
                    className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded-sm p-0.5 transition-opacity cursor-pointer"
                    title="Close tab"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        removeTab(tab.id);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </div>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
          <Button
            variant="outline"
            size="sm"
            onClick={addNewTab}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Tab
          </Button>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <ApiRequestForm
              url={tab.url}
              method={tab.method}
              headers={tab.headers}
              requestBody={tab.requestBody}
              onUrlChange={(value) => updateTabData(tab.id, { url: value })}
              onMethodChange={(value) =>
                updateTabData(tab.id, { method: value })
              }
              onHeadersChange={(value) =>
                updateTabData(tab.id, { headers: value })
              }
              onRequestBodyChange={(value) =>
                updateTabData(tab.id, { requestBody: value })
              }
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
