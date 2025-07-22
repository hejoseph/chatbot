import { Injectable } from '@angular/core';
import { ChatSession, Message } from '../models/message.model';

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private dbName = 'ChatAppDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error opening IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create sessions object store
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionsStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionsStore.createIndex('lastActivity', 'lastActivity', { unique: false });
          sessionsStore.createIndex('isActive', 'isActive', { unique: false });
        }

        // Create messages object store
        if (!db.objectStoreNames.contains('messages')) {
          const messagesStore = db.createObjectStore('messages', { keyPath: 'id' });
          messagesStore.createIndex('sessionId', 'sessionId', { unique: false });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Create app settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        console.log('IndexedDB schema created/updated');
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    if (!this.db) {
      throw new Error('Failed to initialize IndexedDB');
    }
    return this.db;
  }

  // Session operations
  async saveSessions(sessions: ChatSession[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');

    // Clear existing sessions
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Save all sessions
    const promises = sessions.map(session => {
      return new Promise<void>((resolve, reject) => {
        const request = store.add({
          ...session,
          lastActivity: session.lastActivity.toISOString(),
          messages: session.messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp.toISOString()
          }))
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
  }

  async loadSessions(): Promise<ChatSession[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      
      request.onsuccess = () => {
        const sessions = request.result.map((session: any) => ({
          ...session,
          lastActivity: new Date(session.lastActivity),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        
        // Sort by last activity (most recent first)
        sessions.sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
        resolve(sessions);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async saveSession(session: ChatSession): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');

    return new Promise((resolve, reject) => {
      const request = store.put({
        ...session,
        lastActivity: session.lastActivity.toISOString(),
        messages: session.messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        }))
      });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');

    return new Promise((resolve, reject) => {
      const request = store.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings operations
  async saveSetting(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['settings'], 'readwrite');
    const store = transaction.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async loadSetting(key: string): Promise<any> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['settings'], 'readonly');
    const store = transaction.objectStore('settings');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Utility methods
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['sessions', 'settings'], 'readwrite');
    
    const promises = [
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('sessions').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('settings').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ];

    await Promise.all(promises);
  }

  async exportData(): Promise<{ sessions: ChatSession[], settings: any }> {
    const sessions = await this.loadSessions();
    const settings = {}; // You can expand this to load all settings if needed
    
    return { sessions, settings };
  }

  async importData(data: { sessions: ChatSession[], settings?: any }): Promise<void> {
    if (data.sessions) {
      await this.saveSessions(data.sessions);
    }
    
    if (data.settings) {
      const db = await this.ensureDB();
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      for (const [key, value] of Object.entries(data.settings)) {
        await new Promise<void>((resolve, reject) => {
          const request = store.put({ key, value });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    }
  }
}