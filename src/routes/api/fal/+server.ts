import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { FalService } from '$lib/services/fal';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { action, ...params } = await request.json();
    
    const fal = new FalService();
    let result;

    switch (action) {
    case 'generateImageKontext':  
        result = await fal.generateImageKontext(params);
        break;

	case 'generateImage':
        result = await fal.generateImage(params);
        break;
      
    case 'generateVideo':
        result = await fal.generateVideo(params);
        break;
      
      case 'generateVideoFromImage':
        result = await fal.generateVideoFromImage(params);
        break;
      
      default:
        return json({ error: `Invalid action - ${action}` }, { status: 400 });
    }

    return json({ 
      success: true, 
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Fal API error:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
};