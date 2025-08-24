import { CLAUDE_API_KEY } from '$env/static/private';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: Array<{ text: string; type: string }>;
  id: string;
  model: string;
  role: string;
  stop_reason: string;
  stop_sequence: string | null;
  type: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeService {
  private apiKey: string;
  private baseUrl = 'https://api.anthropic.com/v1/messages';

  constructor() {
    this.apiKey = CLAUDE_API_KEY;
    if (!this.apiKey) {
      throw new Error('CLAUDE_API_KEY environment variable is required');
    }
  }

  async sendMessage(
    messages: ClaudeMessage[],
    systemPrompt?: string,
    maxTokens: number = 1000
  ): Promise<ClaudeResponse> {
    const body: any = {
      model: 'claude-3-haiku-20240307', // Fast and cost-effective for brainstorming
      max_tokens: maxTokens,
      messages: messages
    };

    if (systemPrompt) {
      body.system = systemPrompt;
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    return await response.json();
  }

  // Story development helper prompts
  async brainstormStoryIdeas(userInput: string): Promise<string> {
    const systemPrompt = `You are a creative writing assistant helping users develop interactive stories and presentations. Your responses should be:
- Creative and engaging
- Practical and actionable
- Focused on interactive elements and branching narratives
- Suitable for both entertainment stories and business presentations
- Concise but inspiring

Help users explore "what if" scenarios, character motivations, plot developments, and interactive decision points.`;

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: `Help me brainstorm and develop this story/presentation idea: ${userInput}`
      }
    ];

    const response = await this.sendMessage(messages, systemPrompt);
    return response.content[0]?.text || 'Sorry, I couldn\'t generate a response.';
  }

  async analyzeStoryStructure(storyText: string): Promise<string> {
    const systemPrompt = `You are a story structure analyst. Analyze the given story/presentation content and provide feedback on:
- Narrative flow and pacing
- Interactive decision points that could be added
- Character or topic development opportunities
- Ways to make it more engaging
- Potential branching paths

Be constructive and specific in your suggestions.`;

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: `Please analyze this story/presentation content and suggest improvements: ${storyText}`
      }
    ];

    const response = await this.sendMessage(messages, systemPrompt);
    return response.content[0]?.text || 'Sorry, I couldn\'t analyze the content.';
  }

  async suggestBusinessAngles(storyIdea: string): Promise<string> {
    const systemPrompt = `You are a business presentation consultant. Help users transform creative story ideas into engaging business presentations. Focus on:
- How to make data and information more engaging through storytelling
- Interactive decision trees for business scenarios
- Ways to involve the audience in the presentation
- Professional but engaging narrative structures

Always maintain business appropriateness while adding creative flair.`;

    const messages: ClaudeMessage[] = [
      {
        role: 'user',
        content: `How could this story idea be adapted into an engaging business presentation: ${storyIdea}`
      }
    ];

    const response = await this.sendMessage(messages, systemPrompt);
    return response.content[0]?.text || 'Sorry, I couldn\'t suggest business angles.';
  }

  async continueConversation(
    messages: ClaudeMessage[],
    systemPrompt?: string
  ): Promise<string> {
    const response = await this.sendMessage(messages, systemPrompt);
    return response.content[0]?.text || 'Sorry, I couldn\'t continue the conversation.';
  }
}