"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Download, Upload, RefreshCw } from "lucide-react";

interface StorageItem {
  key: string;
  value: string;
  size: number;
}

interface IndexedDBItem {
  key: string;
  value: unknown;
  store: string;
}

interface CookieItem {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
  size: number;
}

export default function WebStoragePage() {
  const [activeTab, setActiveTab] = useState<
    "localStorage" | "sessionStorage" | "indexedDB" | "cookies"
  >("localStorage");
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [indexedDBItems, setIndexedDBItems] = useState<IndexedDBItem[]>([]);
  const [cookieItems, setCookieItems] = useState<CookieItem[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [dbName, setDbName] = useState("test-db");
  const [storeName, setStoreName] = useState("test-store");

  const loadStorageItems = useCallback(() => {
    if (typeof window === "undefined") return;

    const storage =
      activeTab === "localStorage" ? localStorage : sessionStorage;
    const items: StorageItem[] = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key) {
        const value = storage.getItem(key) || "";
        items.push({
          key,
          value,
          size: new Blob([value]).size,
        });
      }
    }

    setStorageItems(items.sort((a, b) => a.key.localeCompare(b.key)));
  }, [activeTab]);

  const loadIndexedDBItems = useCallback(async () => {
    if (typeof window === "undefined" || !("indexedDB" in window)) return;

    try {
      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          setIndexedDBItems([]);
          db.close();
          return;
        }

        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const getAllRequest = store.getAll();

        getAllRequest.onsuccess = () => {
          const getAllKeysRequest = store.getAllKeys();
          getAllKeysRequest.onsuccess = () => {
            const items: IndexedDBItem[] = [];
            const values = getAllRequest.result;
            const keys = getAllKeysRequest.result;

            keys.forEach((key, index) => {
              items.push({
                key: String(key),
                value: values[index],
                store: storeName,
              });
            });

            setIndexedDBItems(items);
          };
        };

        db.close();
      };

      request.onerror = () => {
        console.error("Error opening IndexedDB:", request.error);
        setIndexedDBItems([]);
      };
    } catch {
      console.error("Error loading IndexedDB items");
    }
  }, [dbName, storeName]);

  const loadCookieItems = useCallback(() => {
    if (typeof window === "undefined") return;

    try {
      const cookies = document.cookie.split(';');
      const items: CookieItem[] = [];

      cookies.forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value !== undefined) {
          const cookieValue = decodeURIComponent(value || '');
          items.push({
            name: decodeURIComponent(name),
            value: cookieValue,
            size: new Blob([name + '=' + cookieValue]).size,
          });
        }
      });

      setCookieItems(items.sort((a, b) => a.name.localeCompare(b.name)));
    } catch {
      console.error("Error loading cookies");
      setCookieItems([]);
    }
  }, []);

  useEffect(() => {
    loadStorageItems();
    loadIndexedDBItems();
    loadCookieItems();
  }, [loadStorageItems, loadIndexedDBItems, loadCookieItems]);

  const addStorageItem = () => {
    if (!newKey.trim()) {
      toast.error("Please enter a key");
      return;
    }

    if (typeof window === "undefined") return;

    try {
      const storage =
        activeTab === "localStorage" ? localStorage : sessionStorage;
      storage.setItem(newKey, newValue);
      setNewKey("");
      setNewValue("");
      loadStorageItems();
      toast.success("Item added successfully");
    } catch {
      toast.error("Failed to add item: Storage quota exceeded or other error");
    }
  };

  const deleteStorageItem = (key: string) => {
    if (typeof window === "undefined") return;

    try {
      const storage =
        activeTab === "localStorage" ? localStorage : sessionStorage;
      storage.removeItem(key);
      loadStorageItems();
      toast.success("Item deleted successfully");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const updateStorageItem = (key: string) => {
    if (typeof window === "undefined") return;

    try {
      const storage =
        activeTab === "localStorage" ? localStorage : sessionStorage;
      storage.setItem(key, editingValue);
      setEditingKey(null);
      setEditingValue("");
      loadStorageItems();
      toast.success("Item updated successfully");
    } catch {
      toast.error("Failed to update item");
    }
  };

  const clearStorage = () => {
    if (typeof window === "undefined") return;

    try {
      const storage =
        activeTab === "localStorage" ? localStorage : sessionStorage;
      storage.clear();
      loadStorageItems();
      toast.success("Storage cleared successfully");
    } catch {
      toast.error("Failed to clear storage");
    }
  };

  const addIndexedDBItem = async () => {
    if (!newKey.trim()) {
      toast.error("Please enter a key");
      return;
    }

    if (typeof window === "undefined" || !("indexedDB" in window)) return;

    try {
      let parsedValue;
      try {
        parsedValue = JSON.parse(newValue);
      } catch {
        parsedValue = newValue;
      }

      const request = indexedDB.open(dbName, 1);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);

        store.put(parsedValue, newKey);

        transaction.oncomplete = () => {
          setNewKey("");
          setNewValue("");
          loadIndexedDBItems();
          toast.success("Item added to IndexedDB");
        };

        transaction.onerror = () => {
          toast.error("Failed to add item to IndexedDB");
        };

        db.close();
      };

      request.onerror = () => {
        toast.error("Failed to open IndexedDB");
      };
    } catch {
      toast.error("Failed to add IndexedDB item");
    }
  };

  const deleteIndexedDBItem = async (key: string) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) return;

    try {
      const request = indexedDB.open(dbName, 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);

        store.delete(key);

        transaction.oncomplete = () => {
          loadIndexedDBItems();
          toast.success("Item deleted from IndexedDB");
        };

        transaction.onerror = () => {
          toast.error("Failed to delete item from IndexedDB");
        };

        db.close();
      };

      request.onerror = () => {
        toast.error("Failed to open IndexedDB");
      };
    } catch {
      toast.error("Failed to delete IndexedDB item");
    }
  };

  const clearIndexedDB = async () => {
    if (typeof window === "undefined" || !("indexedDB" in window)) return;

    try {
      const request = indexedDB.open(dbName, 1);

      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);

        store.clear();

        transaction.oncomplete = () => {
          loadIndexedDBItems();
          toast.success("IndexedDB store cleared");
        };

        transaction.onerror = () => {
          toast.error("Failed to clear IndexedDB store");
        };

        db.close();
      };

      request.onerror = () => {
        toast.error("Failed to open IndexedDB");
      };
    } catch {
      toast.error("Failed to clear IndexedDB");
    }
  };

  const addCookieItem = () => {
    if (!newKey.trim()) {
      toast.error("Please enter a cookie name");
      return;
    }

    if (typeof window === "undefined") return;

    try {
      const cookieString = `${encodeURIComponent(newKey)}=${encodeURIComponent(newValue)}; path=/`;
      document.cookie = cookieString;
      setNewKey("");
      setNewValue("");
      loadCookieItems();
      toast.success("Cookie added successfully");
    } catch {
      toast.error("Failed to add cookie");
    }
  };

  const deleteCookieItem = (name: string) => {
    if (typeof window === "undefined") return;

    try {
      // Set cookie to expire in the past to delete it
      document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      loadCookieItems();
      toast.success("Cookie deleted successfully");
    } catch {
      toast.error("Failed to delete cookie");
    }
  };

  const updateCookieItem = (name: string) => {
    if (typeof window === "undefined") return;

    try {
      // Delete the old cookie first
      document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      // Add the updated cookie
      const cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(editingValue)}; path=/`;
      document.cookie = cookieString;
      setEditingKey(null);
      setEditingValue("");
      loadCookieItems();
      toast.success("Cookie updated successfully");
    } catch {
      toast.error("Failed to update cookie");
    }
  };

  const clearCookies = () => {
    if (typeof window === "undefined") return;

    try {
      // Get all cookies and delete them
      const cookies = document.cookie.split(';');
      cookies.forEach(cookie => {
        const [name] = cookie.trim().split('=');
        if (name) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        }
      });
      loadCookieItems();
      toast.success("All cookies cleared successfully");
    } catch {
      toast.error("Failed to clear cookies");
    }
  };

  const exportData = () => {
    let data;
    if (activeTab === "indexedDB") {
      data = indexedDBItems;
    } else if (activeTab === "cookies") {
      data = cookieItems;
    } else {
      data = storageItems;
    }
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTab}-export-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (activeTab === "indexedDB") {
          // Import to IndexedDB
          for (const item of data) {
            if (item.key && item.value !== undefined) {
              await new Promise<void>((resolve, reject) => {
                const request = indexedDB.open(dbName, 1);

                request.onupgradeneeded = () => {
                  const db = request.result;
                  if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName);
                  }
                };

                request.onsuccess = () => {
                  const db = request.result;
                  const transaction = db.transaction([storeName], "readwrite");
                  const store = transaction.objectStore(storeName);

                  store.put(item.value, item.key);

                  transaction.oncomplete = () => {
                    db.close();
                    resolve();
                  };

                  transaction.onerror = () => {
                    db.close();
                    reject();
                  };
                };

                request.onerror = () => reject();
              });
            }
          }
          loadIndexedDBItems();
        } else if (activeTab === "cookies") {
          // Import to cookies
          for (const item of data) {
            if (item.name && item.value !== undefined) {
              const cookieString = `${encodeURIComponent(item.name)}=${encodeURIComponent(item.value)}; path=/`;
              document.cookie = cookieString;
            }
          }
          loadCookieItems();
        } else {
          // Import to localStorage/sessionStorage
          const storage =
            activeTab === "localStorage" ? localStorage : sessionStorage;
          for (const item of data) {
            if (item.key && item.value !== undefined) {
              storage.setItem(item.key, item.value);
            }
          }
          loadStorageItems();
        }

        toast.success("Data imported successfully");
      } catch {
        toast.error("Failed to import data: Invalid JSON format");
      }
    };
    reader.readAsText(file);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTotalSize = () => {
    if (activeTab === "indexedDB") {
      return indexedDBItems.reduce((total, item) => {
        return total + new Blob([JSON.stringify(item.value)]).size;
      }, 0);
    } else if (activeTab === "cookies") {
      return cookieItems.reduce((total, item) => total + item.size, 0);
    }
    return storageItems.reduce((total, item) => total + item.size, 0);
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Web Storage</h1>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={importData}
              className="hidden"
            />
            <Button variant="outline" size="sm" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
          </label>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === "localStorage" ? "default" : "outline"}
          onClick={() => setActiveTab("localStorage")}
        >
          Local Storage
        </Button>
        <Button
          variant={activeTab === "sessionStorage" ? "default" : "outline"}
          onClick={() => setActiveTab("sessionStorage")}
        >
          Session Storage
        </Button>
        <Button
          variant={activeTab === "indexedDB" ? "default" : "outline"}
          onClick={() => setActiveTab("indexedDB")}
        >
          IndexedDB
        </Button>
        <Button
          variant={activeTab === "cookies" ? "default" : "outline"}
          onClick={() => setActiveTab("cookies")}
        >
          Cookies
        </Button>
      </div>

      {activeTab === "indexedDB" && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Database Configuration</CardTitle>
              <CardDescription>
                Configure IndexedDB database and store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Database Name</label>
                <Input
                  value={dbName}
                  onChange={(e) => setDbName(e.target.value)}
                  placeholder="database-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Store Name</label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="store-name"
                />
              </div>
              <Button onClick={loadIndexedDBItems} size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Connect
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Storage Info</CardTitle>
              <CardDescription>Current storage statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items:</span>
                  <Badge variant="secondary">
                    {indexedDBItems.length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Total Size:</span>
                  <Badge variant="secondary">
                    {formatBytes(getTotalSize())}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Storage Type:</span>
                  <Badge>{activeTab}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab !== "indexedDB" && (
        <Card>
          <CardHeader>
            <CardTitle>Storage Info</CardTitle>
            <CardDescription>Current storage statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Items:</span>
                <Badge variant="secondary">
                  {activeTab === "cookies" ? cookieItems.length : storageItems.length}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Total Size:</span>
                <Badge variant="secondary">
                  {formatBytes(getTotalSize())}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Storage Type:</span>
                <Badge>{activeTab}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Add New Item</CardTitle>
          <CardDescription>
            {activeTab === "indexedDB"
              ? "Add a new key-value pair to IndexedDB (JSON values will be parsed)"
              : activeTab === "cookies"
              ? "Add a new cookie to the current domain"
              : `Add a new key-value pair to ${activeTab}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">
                {activeTab === "cookies" ? "Name" : "Key"}
              </label>
              <Input
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder={activeTab === "cookies" ? "Enter cookie name" : "Enter key"}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Value</label>
              <Textarea
                value={newValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setNewValue(e.target.value)
                }
                placeholder={
                  activeTab === "indexedDB"
                    ? "Enter value (JSON supported)"
                    : activeTab === "cookies"
                    ? "Enter cookie value"
                    : "Enter value"
                }
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={
                  activeTab === "indexedDB" 
                    ? addIndexedDBItem 
                    : activeTab === "cookies"
                    ? addCookieItem
                    : addStorageItem
                }
                className="w-full"
              >
                Add Item
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Storage Items</CardTitle>
              <CardDescription>
                {activeTab === "indexedDB"
                  ? indexedDBItems.length
                  : activeTab === "cookies"
                  ? cookieItems.length
                  : storageItems.length}{" "}
                items in {activeTab}
              </CardDescription>
            </div>
            <Button
              onClick={
                activeTab === "indexedDB" 
                  ? clearIndexedDB 
                  : activeTab === "cookies"
                  ? clearCookies
                  : clearStorage
              }
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === "indexedDB" ? (
            indexedDBItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No items in IndexedDB store
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {indexedDBItems.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell className="font-mono font-medium">
                        {item.key}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {typeof item.value}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="bg-muted p-2 rounded text-sm font-mono break-all max-h-20 overflow-y-auto">
                          {typeof item.value === "object"
                            ? JSON.stringify(item.value, null, 2)
                            : String(item.value)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => deleteIndexedDBItem(item.key)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : activeTab === "cookies" ? (
            cookieItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No cookies found
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cookieItems.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-mono font-medium">
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {formatBytes(item.size)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-md">
                        {editingKey === item.name ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editingValue}
                              onChange={(
                                e: React.ChangeEvent<HTMLTextAreaElement>
                              ) => setEditingValue(e.target.value)}
                              className="min-h-[60px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={() => updateCookieItem(item.name)}
                                size="sm"
                              >
                                Save
                              </Button>
                              <Button
                                onClick={() => {
                                  setEditingKey(null);
                                  setEditingValue("");
                                }}
                                variant="outline"
                                size="sm"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className="bg-muted p-2 rounded text-sm font-mono break-all max-h-20 overflow-y-auto cursor-pointer hover:bg-muted/80"
                            onClick={() => {
                              setEditingKey(item.name);
                              setEditingValue(item.value);
                            }}
                          >
                            {item.value}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => deleteCookieItem(item.name)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          ) : storageItems.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No items in {activeTab}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storageItems.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell className="font-mono font-medium">
                      {item.key}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {formatBytes(item.size)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {editingKey === item.key ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingValue}
                            onChange={(
                              e: React.ChangeEvent<HTMLTextAreaElement>
                            ) => setEditingValue(e.target.value)}
                            className="min-h-[60px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => updateStorageItem(item.key)}
                              size="sm"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingKey(null);
                                setEditingValue("");
                              }}
                              variant="outline"
                              size="sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="bg-muted p-2 rounded text-sm font-mono break-all max-h-20 overflow-y-auto cursor-pointer hover:bg-muted/80"
                          onClick={() => {
                            setEditingKey(item.key);
                            setEditingValue(item.value);
                          }}
                        >
                          {item.value}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        onClick={() => deleteStorageItem(item.key)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
