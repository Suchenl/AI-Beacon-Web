
import { Pillar, FileSystemFileHandle } from './types';

// Declare global window types for the API
declare global {
    interface Window {
        showOpenFilePicker: (options?: any) => Promise<FileSystemFileHandle[]>;
        showSaveFilePicker: (options?: any) => Promise<FileSystemFileHandle>;
        isSecureContext: boolean;
    }
}

const isNativeAPISupported = () => {
    // Desktop shells (Electron/Tauri) often lack isSecureContext but still expose pickers.
    if (typeof window === 'undefined') return false;
    return typeof window.showOpenFilePicker === 'function';
};

/**
 * UNIFIED OPEN STRATEGY
 * Tries to open in "Sync Mode" (Attached).
 * If unsupported or fails, falls back to "Snapshot Mode" (Import).
 */
export const openDatabase = async (): Promise<{ data: any, handle: FileSystemFileHandle | null, mode: 'synced' | 'snapshot' } | null> => {
    // 1. Try Native API
    if (isNativeAPISupported()) {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{ description: 'JSON Database', accept: { 'application/json': ['.json'] } }],
                multiple: false,
            });

            const file = await handle.getFile();
            const text = await file.text();
            const data = JSON.parse(text);

            return { data, handle, mode: 'synced' };
        } catch (err: any) {
            // If user cancelled, stop.
            if (err.name === 'AbortError') return null;
            console.warn("Native Open Failed, falling back...", err);
            // Fall through to strategy 2
        }
    }

    // 2. Fallback: Snapshot Mode
    const data = await loadJSON();
    if (data) {
        return { data, handle: null, mode: 'snapshot' };
    }

    return null;
};

/**
 * UNIFIED SAVE STRATEGY
 * Tries to save using Native API (Save As).
 * If unsupported, triggers standard download.
 */
export const saveDatabase = async (data: any, suggestedName: string): Promise<{ handle: FileSystemFileHandle | null, mode: 'synced' | 'snapshot' } | null> => {
    // 1. Try Native API
    if (isNativeAPISupported()) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName,
                types: [{ description: 'JSON Database', accept: { 'application/json': ['.json'] } }],
            });

            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();

            return { handle, mode: 'synced' };
        } catch (err: any) {
            if (err.name === 'AbortError') return null;
            console.warn("Native Save Failed, falling back...", err);
            // Fall through to strategy 2
        }
    }

    // 2. Fallback: Download
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);

    return { handle: null, mode: 'snapshot' };
};

/**
 * Saves a JSON object to a new file (Export).
 * Wrapper around saveDatabase logic for single exports.
 */
export const saveNewJSON = async (data: any, suggestedName: string): Promise<void> => {
    await saveDatabase(data, suggestedName);
};

/**
 * Loads a JSON file strictly for reading (Import).
 * Features a robust fallback to <input type="file"> for maximum compatibility.
 */
export const loadJSON = async (): Promise<any | null> => {
    // Strategy 1: Try Native API (Cleaner UX) - Only if supported
    if (isNativeAPISupported()) {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{ description: 'JSON File', accept: { 'application/json': ['.json'] } }],
                multiple: false,
            });
            const file = await handle.getFile();
            const text = await file.text();
            return JSON.parse(text);
        } catch (err: any) {
            if (err.name === 'AbortError') return null;
            console.warn("Native picker failed, falling back to input", err);
            // Fall through to Strategy 2
        }
    }

    // Strategy 2: Legacy Input Fallback (Works everywhere, including HTTP/IP)
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.style.display = 'none'; // Ensure it's hidden
        document.body.appendChild(input); // Append to body to ensure iOS compatibility

        input.onchange = async (e: any) => {
            const file = e.target.files?.[0];
            if (file) {
                try {
                    const text = await file.text();
                    resolve(JSON.parse(text));
                } catch (e) {
                    console.error("Parse error", e);
                    alert("Failed to parse JSON file.");
                    resolve(null);
                }
            } else {
                resolve(null);
            }
            document.body.removeChild(input);
        };
        input.click();
    });
};

/**
 * Saves data to an EXISTING file handle without prompting the user (Auto-Save).
 */
export const saveToHandle = async (handle: FileSystemFileHandle, data: any): Promise<void> => {
    if (!isNativeAPISupported()) throw new Error("Native API not supported");

    try {
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
    } catch (err) {
        console.error("Auto-save failed:", err);
        throw err;
    }
};

/**
 * Loads the default knowledge base from public/knowledge-base.json
 * This is the initial data source for the application.
 */
export const loadDefaultKnowledgeBase = async (): Promise<Pillar[] | null> => {
    try {
        const response = await fetch('/knowledge-base.json');
        if (!response.ok) {
            console.warn('Failed to load default knowledge base, falling back to constants');
            return null;
        }
        const data = await response.json();
        return data;
    } catch (err) {
        console.error('Error loading default knowledge base:', err);
        return null;
    }
};

/**
 * Attempts to automatically open and link to the default knowledge-base.json file.
 * This will prompt the user to select the file if File System Access API is supported.
 * Returns the file handle and data if successful, null otherwise.
 */
export const autoLinkDefaultKnowledgeBase = async (): Promise<{ data: Pillar[], handle: FileSystemFileHandle | null, mode: 'synced' | 'snapshot' } | null> => {
    // Only attempt if File System Access API is supported
    if (!isNativeAPISupported()) {
        console.log('File System Access API not supported, skipping auto-link');
        return null;
    }

    try {
        // Try to open the knowledge-base.json file
        // Note: This will prompt the user to select the file
        const [handle] = await window.showOpenFilePicker({
            types: [{ description: 'Knowledge Base', accept: { 'application/json': ['.json'] } }],
            multiple: false,
            suggestedName: 'knowledge-base.json',
            excludeAcceptAllOption: false,
        });

        const file = await handle.getFile();

        // Check if the file name matches (optional check)
        if (!file.name.includes('knowledge-base')) {
            console.warn('Selected file does not appear to be knowledge-base.json');
            // Continue anyway, user might have renamed it
        }

        const text = await file.text();
        const data = JSON.parse(text);

        return { data, handle, mode: 'synced' };
    } catch (err: any) {
        // User cancelled or error occurred
        if (err.name === 'AbortError') {
            console.log('User cancelled file selection');
            return null;
        }
        console.warn('Auto-link failed:', err);
        return null;
    }
};

/**
 * Automatically opens and links to public/knowledge-base.json on app startup.
 * First tries to load data from the public file, then attempts to get a file handle.
 * Returns the file handle and data if successful, null otherwise.
 */
export const autoOpenKnowledgeBase = async (): Promise<{ data: Pillar[], handle: FileSystemFileHandle | null, mode: 'synced' | 'snapshot' } | null> => {
    // First, try to load data from public/knowledge-base.json
    let data: Pillar[] | null = null;
    try {
        data = await loadDefaultKnowledgeBase();
        if (!data) {
            console.warn('Failed to load knowledge-base.json from public folder');
            return null;
        }
    } catch (err) {
        console.error('Error loading knowledge-base.json:', err);
        return null;
    }

    // If File System Access API is supported, try to get a file handle
    if (isNativeAPISupported()) {
        try {
            // Try to open the file (may prompt user on first time)
            const [handle] = await window.showOpenFilePicker({
                types: [{ description: 'Knowledge Base', accept: { 'application/json': ['.json'] } }],
                multiple: false,
                suggestedName: 'knowledge-base.json',
                excludeAcceptAllOption: false,
            });

            const file = await handle.getFile();
            const fileText = await file.text();
            const fileData = JSON.parse(fileText);

            // Use the data from the file handle (in case it's different from public version)
            return { data: fileData, handle, mode: 'synced' };
        } catch (err: any) {
            // If user cancels or error occurs, return data without file handle (snapshot mode)
            if (err.name === 'AbortError') {
                console.log('User cancelled file selection, using snapshot mode');
            } else {
                console.warn('Failed to get file handle, using snapshot mode:', err);
            }
            // Return data in snapshot mode (no file handle)
            return { data, handle: null, mode: 'snapshot' };
        }
    }

    // If File System Access API is not supported, return data in snapshot mode
    return { data, handle: null, mode: 'snapshot' };
};

/**
 * IndexedDB helper functions for storing and retrieving file handles
 */
const DB_NAME = 'ai-beacon-file-handles';
const DB_VERSION = 1;
const STORE_NAME = 'handles';

const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
        };
    });
};

/**
 * Saves a file handle to IndexedDB for persistence across page reloads
 */
export const saveFileHandleToIndexedDB = async (handle: FileSystemFileHandle, key: string = 'knowledge-base'): Promise<void> => {
    if (!isNativeAPISupported()) {
        console.warn('File System Access API not supported, cannot save handle');
        return;
    }

    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await store.put(handle, key);
        console.log('✅ File handle saved to IndexedDB');
    } catch (err) {
        console.error('Failed to save file handle to IndexedDB:', err);
    }
};

/**
 * Retrieves a file handle from IndexedDB
 */
const ensureHandlePermission = async (handle: FileSystemFileHandle, mode: 'read' | 'readwrite' = 'readwrite'): Promise<boolean> => {
    if (!isNativeAPISupported()) return false;

    try {
        const queryPermission = (handle as any).queryPermission as ((options?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>) | undefined;
        const requestPermission = (handle as any).requestPermission as ((options?: { mode?: 'read' | 'readwrite' }) => Promise<PermissionState>) | undefined;

        if (typeof queryPermission === 'function') {
            const query = await queryPermission.call(handle, { mode });
            if (query === 'granted') return true;
            if (query === 'denied' && typeof requestPermission !== 'function') return false;
        }

        if (typeof requestPermission === 'function') {
            const request = await requestPermission.call(handle, { mode });
            return request === 'granted';
        }

        // If permission APIs are unavailable, assume success (legacy implementations)
        return true;
    } catch (err) {
        console.warn('Permission check failed for file handle:', err);
        return false;
    }
};

export const getFileHandleFromIndexedDB = async (key: string = 'knowledge-base'): Promise<FileSystemFileHandle | null> => {
    if (!isNativeAPISupported()) {
        return null;
    }

    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        return new Promise((resolve, reject) => {
            request.onsuccess = async () => {
                const handle = request.result;
                if (handle) {
                    const hasPermission = await ensureHandlePermission(handle, 'readwrite');
                    if (!hasPermission) {
                        console.warn('File handle permissions not granted, removing handle');
                        const deleteTransaction = db.transaction(STORE_NAME, 'readwrite');
                        deleteTransaction.objectStore(STORE_NAME).delete(key);
                        resolve(null);
                        return;
                    }

                    handle.getFile().then(() => {
                        console.log('✅ File handle restored from IndexedDB');
                        resolve(handle);
                    }).catch((err) => {
                        console.warn('File handle from IndexedDB is invalid, removing it:', err);
                        // Remove invalid handle
                        const deleteTransaction = db.transaction(STORE_NAME, 'readwrite');
                        deleteTransaction.objectStore(STORE_NAME).delete(key);
                        resolve(null);
                    });
                } else {
                    resolve(null);
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (err) {
        console.error('Failed to get file handle from IndexedDB:', err);
        return null;
    }
};

/**
 * Removes a file handle from IndexedDB
 */
export const removeFileHandleFromIndexedDB = async (key: string = 'knowledge-base'): Promise<void> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        await store.delete(key);
        console.log('✅ File handle removed from IndexedDB');
    } catch (err) {
        console.error('Failed to remove file handle from IndexedDB:', err);
    }
};

/**
 * Saves text content. Useful for creating the .env.local file.
 * Includes robust fallback for browsers that block the File System API.
 * 
 * Returns TRUE if successful (either saved or downloaded).
 * Returns FALSE if operation failed or was cancelled.
 */
export const saveTextFile = async (content: string, suggestedName: string): Promise<boolean> => {
    // Strategy 1: Try Native API (Only if secure context and supported)
    if (isNativeAPISupported()) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName,
                types: [{ description: 'Config File', accept: { 'text/plain': ['.local', '.env'] } }],
            });

            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();
            return true;
        } catch (err: any) {
            if (err.name === 'AbortError') return false;

            // If we are in a cross-origin iframe or insecure context, this will throw.
            // We log it and immediately fall through to Strategy 2.
            console.warn("Native File System API failed, falling back to download.", err);
        }
    }

    // Strategy 2: Blob Download Fallback (Universal)
    try {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = suggestedName;
        document.body.appendChild(a); // Append for Firefox compatibility
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return true;
    } catch (err) {
        console.error("Text Save Error:", err);
        return false;
    }
};
