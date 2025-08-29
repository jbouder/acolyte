'use client';

import { ApiRequestForm } from '@/components/api-request-form';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

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

  const addNewTab = () => {
    const newId = (tabs.length + 1).toString();
    const newTab: TabData = {
      id: newId,
      name: `Request ${newId}`,
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
      headers: 'Content-Type: application/json',
      requestBody: '',
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newId);
  };

  const removeTab = (id: string) => {
    if (tabs.length <= 1) return; // Don't allow removing the last tab

    const newTabs = tabs.filter((tab) => tab.id !== id);
    setTabs(newTabs);

    // If we're removing the active tab, switch to the first tab
    if (activeTab === id) {
      setActiveTab(newTabs[0].id);
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">APIs</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center gap-2 mb-4">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.name}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex items-center gap-1">
            {tabs.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTab(activeTab)}
                className="flex items-center gap-1 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
                Close Tab
              </Button>
            )}
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
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <ApiRequestForm
              initialUrl={tab.url}
              initialMethod={tab.method}
              initialHeaders={tab.headers}
              initialRequestBody={tab.requestBody}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
