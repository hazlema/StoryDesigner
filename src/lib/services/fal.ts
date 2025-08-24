import { FAL_KEY } from '$env/static/private';

export interface FluxKontextParams {
  prompt: string;
  aspect_ratio?: '21:9' | '16:9' | '4:3' | '3:2' | '1:1' | '2:3' | '3:4' | '9:16' | '9:21';
  num_images?: number;
  guidance_scale?: number;
  safety_tolerance?: string;
  enhance_prompt: boolean;
}

export interface FalImageResponse {
  images: Array<{ url: string; width: number; height: number }>;
  seed: number;
  has_nsfw_concepts: boolean[];
  timings: Record<string, unknown>;
}

export interface FalVideoResponse {
  video: { url: string };
}

export interface FluxProParams {
  prompt: string;
  image_size?: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  num_images?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  safety_tolerance?: string;
}

export interface Veo3TextToVideoParams {
  prompt: string;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  duration?: number;
  resolution?: '720p' | '1080p';
  generate_audio?: boolean;
  enhance_prompt?: boolean;
  auto_fix?: boolean;
}

export interface Veo3ImageToVideoParams {
  prompt: string;
  image_url: string;
  duration?: string;
  generate_audio?: boolean;
  resolution?: '720p' | '1080p';
}

export class FalService {
  private apiKey: string;
  private baseUrl = 'https://fal.run';

  constructor() {
    this.apiKey = FAL_KEY;
    if (!this.apiKey) {
      throw new Error('FAL_KEY environment variable is required');
    }
  }

  private async makeRequest<T>(endpoint: string, body: unknown): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Fal API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  // Flux Kontext
  async generateImageKontext(params: FluxKontextParams): Promise<FalImageResponse> {
    console.log(`generateImageKontext: ${JSON.stringify(params)}`);
	return this.makeRequest<FalImageResponse>('/fal-ai/flux-pro/kontext/text-to-image', {
		prompt: params.prompt,
		aspect_ratio: params.aspect_ratio || '16:9',
		num_images: params.num_images || 1,
		guidance_scale: params.guidance_scale || 3.5,
		safety_tolerance: params.safety_tolerance || '4',
		enhance_prompt: true
	});
}

// Flux Pro text-to-image
  async generateImage(params: FluxProParams): Promise<FalImageResponse> {
    return this.makeRequest<FalImageResponse>('/fal-ai/flux-pro', {
      prompt: params.prompt,
      image_size: params.image_size || 'landscape_16_9',
      num_images: params.num_images || 1,
      guidance_scale: params.guidance_scale || 3.5,
      num_inference_steps: params.num_inference_steps || 28,
      safety_tolerance: params.safety_tolerance || '4'
    });
  }

  // VEO3 text-to-video
  async generateVideo(params: Veo3TextToVideoParams): Promise<FalVideoResponse> {
    return this.makeRequest<FalVideoResponse>('/fal-ai/veo3', {
      prompt: params.prompt,
      aspect_ratio: params.aspect_ratio || '16:9',
      duration: params.duration || 8,
      resolution: params.resolution || '720p',
      generate_audio: params.generate_audio ?? true,
      enhance_prompt: params.enhance_prompt ?? true,
      auto_fix: params.auto_fix ?? true
    });
  }

  // VEO3 image-to-video
  async generateVideoFromImage(params: Veo3ImageToVideoParams): Promise<FalVideoResponse> {
    return this.makeRequest<FalVideoResponse>('/fal-ai/veo3/image-to-video', {
      prompt: params.prompt,
      image_url: params.image_url,
      duration: params.duration || '8s',
      generate_audio: params.generate_audio ?? true,
      resolution: params.resolution || '720p'
    });
  }
}