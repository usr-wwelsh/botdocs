/**
 * GGUF model loader using llama.cpp WASM
 */

// Falcon H1 Tiny 90M Instruct GGUF model
const MODEL_URL = 'https://huggingface.co/mradermacher/Falcon-H1-Tiny-90M-Instruct-GGUF/resolve/main/Falcon-H1-Tiny-90M-Instruct.Q4_K_M.gguf';

// llama.cpp WASM module (loaded from CDN)
let llamaCppModule: any = null;
let llamaContext: any = null;

export class GGUFModelLoader {
  private isLoaded: boolean = false;
  private isLoading: boolean = false;

  /**
   * Load llama.cpp WASM and the model
   */
  async load(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isLoaded) return;

    if (this.isLoading) {
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isLoading = true;

    try {
      console.log('Loading llama.cpp WASM runtime...');

      if (onProgress) onProgress(10);

      // Load llama.cpp WASM from CDN
      if (!llamaCppModule) {
        // Dynamically import llama.cpp WASM
        // For now, we'll use a simple fetch approach
        const response = await fetch(MODEL_URL, {
          headers: { 'Range': 'bytes=0-1024' }, // Just check if it exists
        });

        if (!response.ok) {
          throw new Error('Model not accessible');
        }
      }

      if (onProgress) onProgress(30);

      // Download the actual model
      console.log('Downloading Falcon H1 Tiny model...');
      const modelResponse = await fetch(MODEL_URL);
      const modelSize = parseInt(modelResponse.headers.get('content-length') || '0');

      if (!modelResponse.body) {
        throw new Error('Failed to get model stream');
      }

      const reader = modelResponse.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedLength = 0;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        chunks.push(value);
        receivedLength += value.length;

        if (onProgress && modelSize > 0) {
          const progress = 30 + (receivedLength / modelSize) * 70;
          onProgress(Math.min(progress, 100));
        }
      }

      // Combine chunks
      const modelData = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        modelData.set(chunk, position);
        position += chunk.length;
      }

      console.log(`Downloaded ${receivedLength} bytes`);

      // Store in IndexedDB for caching
      await this.cacheModel(modelData);

      this.isLoaded = true;
      if (onProgress) onProgress(100);

      console.log('Falcon H1 Tiny model loaded successfully');
    } catch (error) {
      console.error('Failed to load model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Cache model in IndexedDB
   */
  private async cacheModel(data: Uint8Array): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction('models', 'readwrite');
      const store = tx.objectStore('models');
      await store.put({ id: 'falcon-h1-tiny', data });
    } catch (error) {
      console.warn('Failed to cache model:', error);
    }
  }

  /**
   * Open IndexedDB for model caching
   */
  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('botdocs-models', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('models')) {
          db.createObjectStore('models', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Generate text (placeholder - needs llama.cpp integration)
   */
  async generate(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    if (!this.isLoaded) {
      throw new Error('Model not loaded');
    }

    // TODO: Integrate with llama.cpp WASM for actual generation
    // For now, return a placeholder
    return 'Model loaded but generation not yet implemented. Need llama.cpp WASM integration.';
  }

  isReady(): boolean {
    return this.isLoaded;
  }
}

// Singleton
let modelLoaderInstance: GGUFModelLoader | null = null;

export function getGGUFModelLoader(): GGUFModelLoader {
  if (!modelLoaderInstance) {
    modelLoaderInstance = new GGUFModelLoader();
  }
  return modelLoaderInstance;
}
