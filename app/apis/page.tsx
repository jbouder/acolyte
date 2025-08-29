'use client';

import { ApiRequestForm } from '@/components/api-request-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">APIs</h1>
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
