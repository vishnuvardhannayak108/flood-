export interface QueuedRequest {
  client_request_id: string;
  type: "sos" | "incident" | "status_update";
  payload: any;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = "ferrcs_offline_db";
const STORE_NAME = "outbox";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB not supported in this environment"));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "client_request_id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

let memoryQueue: QueuedRequest[] = [];

/**
 * Enqueues an offline request with deterministic idempotency UUID
 */
export async function enqueueOfflineRequest(
  type: "sos" | "incident" | "status_update",
  payload: any
): Promise<string> {
  const client_request_id = payload.client_request_id || crypto.randomUUID();
  const item: QueuedRequest = {
    client_request_id,
    type,
    payload: { ...payload, client_request_id },
    timestamp: Date.now(),
    retryCount: 0,
  };

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);

      req.onsuccess = () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ferrcs_outbox_updated"));
        }
        resolve(client_request_id);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    if (typeof localStorage !== "undefined") {
      const queue = JSON.parse(localStorage.getItem("ferrcs_fallback_queue") || "[]");
      queue.push(item);
      localStorage.setItem("ferrcs_fallback_queue", JSON.stringify(queue));
    } else {
      memoryQueue.push(item);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ferrcs_outbox_updated"));
    }
    return client_request_id;
  }
}

/**
 * Fetches all pending requests from outbox
 */
export async function getPendingRequests(): Promise<QueuedRequest[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof localStorage !== "undefined") {
      return JSON.parse(localStorage.getItem("ferrcs_fallback_queue") || "[]");
    }
    return [...memoryQueue];
  }
}

/**
 * Removes successfully synchronized request from outbox
 */
export async function removePendingRequest(client_request_id: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(client_request_id);

      req.onsuccess = () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ferrcs_outbox_updated"));
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof localStorage !== "undefined") {
      const queue: QueuedRequest[] = JSON.parse(localStorage.getItem("ferrcs_fallback_queue") || "[]");
      const updated = queue.filter((i) => i.client_request_id !== client_request_id);
      localStorage.setItem("ferrcs_fallback_queue", JSON.stringify(updated));
    } else {
      memoryQueue = memoryQueue.filter((i) => i.client_request_id !== client_request_id);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ferrcs_outbox_updated"));
    }
  }
}

/**
 * Replays all queued requests when internet connectivity is re-established
 */
export async function replayPendingQueue(
  sendFn: (item: QueuedRequest) => Promise<boolean>
): Promise<number> {
  const pending = await getPendingRequests();
  let replayedCount = 0;

  for (const item of pending) {
    try {
      const success = await sendFn(item);
      if (success) {
        await removePendingRequest(item.client_request_id);
        replayedCount++;
      }
    } catch (err) {
      console.error(`Failed to replay request ${item.client_request_id}:`, err);
    }
  }

  return replayedCount;
}

/**
 * Clears all pending requests from the offline outbox
 */
export async function clearPendingQueue(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();
      req.onsuccess = () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("ferrcs_outbox_updated"));
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("ferrcs_fallback_queue");
    }
    memoryQueue = [];
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("ferrcs_outbox_updated"));
    }
  }
}

