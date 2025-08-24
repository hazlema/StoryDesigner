import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFileSync } from 'fs';
import { join } from 'path';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { templates } = await request.json();
    
    // Generate the new file content
    const fileContent = `// Prompt enhancement templates and logic

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
}

export const defaultTemplates: PromptTemplate[] = ${JSON.stringify(templates, null, 2)};

export class PromptEnhancer {
  private templates: PromptTemplate[];

  constructor(customTemplates: PromptTemplate[] = []) {
    this.templates = [...defaultTemplates, ...customTemplates];
  }

  getTemplates(): PromptTemplate[] {
    return this.templates;
  }

  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.find(t => t.id === id);
  }

  enhancePrompt(userInput: string, templateId: string): string {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(\`Template not found: \${templateId}\`);
    }

    return template.template.replace(/\\[USER_INPUT\\]/g, userInput);
  }

  addTemplate(template: PromptTemplate): void {
    this.templates.push(template);
  }

  removeTemplate(id: string): void {
    this.templates = this.templates.filter(t => t.id !== id);
  }
}`;

    // Write to the promptEnhancer.ts file
    const filePath = join(process.cwd(), 'src/lib/services/promptEnhancer.ts');
    writeFileSync(filePath, fileContent, 'utf-8');
    
    return json({ success: true });
  } catch (error) {
    console.error('Error saving templates:', error);
    return json({ error: 'Failed to save templates' }, { status: 500 });
  }
};