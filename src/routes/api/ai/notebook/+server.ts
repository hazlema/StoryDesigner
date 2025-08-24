import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ClaudeService } from '$lib/services/claude';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { action, content, messages, systemPrompt } = await request.json();
    
    const claude = new ClaudeService();
    let response: string;

    switch (action) {
      case 'brainstorm':
        response = await claude.brainstormStoryIdeas(content);
        break;
      
      case 'analyze':
        response = await claude.analyzeStoryStructure(content);
        break;
      
      case 'business':
        response = await claude.suggestBusinessAngles(content);
        break;
      
      case 'continue':
        response = await claude.continueConversation(messages, systemPrompt);
        break;
      
      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }

    return json({ 
      success: true, 
      response,
      usage: 'Token usage tracking could be added here'
    });

  } catch (error) {
    console.error('AI Notebook API error:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
};