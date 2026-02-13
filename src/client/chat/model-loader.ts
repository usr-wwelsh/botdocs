/**
 * Falcon H1 Tiny 90M with Transformers.js
 * Uses the native HuggingFace model, not GGUF
 */
import { pipeline, env } from '@xenova/transformers';

// Falcon H1 Tiny 90M Instruct (ONNX format for Transformers.js)
const MODEL_ID = 'onnx-community/Falcon-H1-Tiny-90M-Instruct-ONNX';

// Configure transformers.js to use local models and cache
env.allowLocalModels = false;
env.useBrowserCache = true;

export class ModelLoader {
  private generator: any = null;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;

  async load(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isLoaded) return;
    if (this.isLoading) {
      while (this.isLoading) await new Promise(r => setTimeout(r, 100));
      return;
    }

    this.isLoading = true;

    try {
      console.log('Loading Falcon H1 Tiny 90M Instruct...');
      if (onProgress) onProgress(5);

      // Load the text-generation pipeline
      this.generator = await pipeline('text-generation', MODEL_ID, {
        progress_callback: (progress: any) => {
          if (onProgress && progress.status === 'progress') {
            // Map download progress to 5-100%
            const percent = progress.progress || 0;
            const mappedProgress = 5 + (percent * 95);
            onProgress(Math.min(mappedProgress, 100));
          }
        },
      });

      this.isLoaded = true;
      if (onProgress) onProgress(100);
      console.log('Falcon H1 Tiny 90M loaded successfully');

    } catch (error) {
      console.error('Failed to load model:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async generate(
    prompt: string,
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    if (!this.isLoaded || !this.generator) {
      throw new Error('Model not loaded');
    }

    const { maxTokens = 256, temperature = 0.7 } = options;

    try {
      console.log('Generating response...');

      // Generate response using transformers.js
      const result = await this.generator(prompt, {
        max_new_tokens: maxTokens,
        temperature: temperature,
        top_p: 0.9,
        top_k: 40,
        repetition_penalty: 1.1,
        do_sample: true,
        return_full_text: false,
      });

      // Extract the generated text
      const generatedText = result[0]?.generated_text || '';
      return generatedText.trim() || 'I could not generate a response.';
    } catch (error) {
      console.error('Generation error:', error);
      return 'Sorry, I encountered an error generating a response.';
    }
  }

  isReady(): boolean {
    return this.isLoaded;
  }

  async unload(): Promise<void> {
    // Transformers.js models are garbage collected automatically
    this.generator = null;
    this.isLoaded = false;
  }
}

let modelLoaderInstance: ModelLoader | null = null;

export function getModelLoader(): ModelLoader {
  if (!modelLoaderInstance) {
    modelLoaderInstance = new ModelLoader();
  }
  return modelLoaderInstance;
}
