// Prompt enhancement templates and logic

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
}

export const defaultTemplates: PromptTemplate[] = [
  {
    id: 'manual',
    name: 'Manual Style',
    description: 'Use your prompt as-is without enhancement',
    template: '[USER_INPUT]'
  },
  {
    id: 'detailed-art',
    name: 'Detailed Art Style',
    description: 'Your proven AI art enhancement with game engine render quality',
    template: `We are trying to enhance an image prompt for an AI image generator.

I would like you to enhance the prompt that I give you. Use as much detail as you can, important things should appear near the start of the prompt. Compound words like Star Ship should appear in parenthesis.

500 characters is the max you can use

Create the output in a paragraph format, try to be as pithy as possible.

Append these words to the start of the max detail prompt.
screen print art, ink color styles, chromatic colors, intricate, ultra fine, render for game engine, 8k.

The prompt to enhance: [USER_INPUT]`
  },
  {
    id: 'cinematic',
    name: 'Cinematic Style',
    description: 'Movie-quality dramatic enhancement',
    template: `Enhance this image prompt for cinematic quality: "[USER_INPUT]"

Add dramatic lighting, camera angles, and movie-like composition. Include technical camera terms, lighting setup, and cinematic mood. Keep it under 400 characters and make it feel like a professional film shot.`
  },
  {
    id: 'photorealistic',
    name: 'Photorealistic',
    description: 'Professional photography enhancement',
    template: `Transform this prompt into a photorealistic photography description: "[USER_INPUT]"

Add professional photography terms, lighting conditions, camera settings, and realistic details. Make it sound like a high-end photography brief. Maximum 350 characters.`
  },
  {
    id: 'anime-style',
    name: 'Anime/Manga',
    description: 'Japanese animation style enhancement',
    template: `Enhance this prompt for anime/manga style generation: "[USER_INPUT]"

Add anime-specific visual elements, art style descriptors, and Japanese animation terminology. Include details about shading, character design, and anime aesthetics. Keep under 400 characters.`
  },
  {
    id: 'fantasy-art',
    name: 'Fantasy Art',
    description: 'Epic fantasy artwork enhancement',
    template: `Enhance this prompt for epic fantasy artwork: "[USER_INPUT]"

Add magical elements, fantasy atmosphere, mystical lighting, and epic scale. Include terms for fantasy art styles, magical effects, and legendary aesthetics. Maximum 400 characters.`
  },
  {
    id: 'story-designer',
    name: 'StoryDesigner',
    description: 'StoryDesigner Theme',
    template: `Enhance this image prompt for storytelling artwork: "[USER_INPUT]"

This should be a whimsical cartoon featuring pixar style Santa Elves.
Diminutive Size: Santa's elves are famously pint-sized, perfect for squeezing into toy workshops without bumping their heads—think hobbit-height but with more holiday cheer.
Pointy Ears: Those iconic, Vulcan-like ears aren't just for show; they're a nod to their mythological roots in folklore, helping them hear the faintest "ho ho ho" from miles away.
Festive Attire: Clad in green and red outfits with jingle bells and curly-toed shoes, they're the original fashion elves, always ready for a North Pole runway.
Toy-Making Expertise: Master craftsmen who whip up gadgets faster than a 3D printer, turning wood and wishes into wonders—Santa's little R&D team.
Mischievous Nature: Playful pranksters at heart, they might swap your socks or hide the cookies, channeling ancient elf lore's trickster vibes with a jolly twist.
Longevity: Often depicted as ageless or immortal, these elves have been cranking out presents since the days of yore, outlasting even the longest Black Friday lines.
North Pole Residents: They call the icy North Pole home, where it's always winter but never Christmas... wait, no, it's always pre-Christmas crunch time!
Helper Spirits: Loyal aides to Santa, sorting the naughty from the nice like efficient little algorithms, ensuring no one gets coal by mistake.
Jolly Disposition: Perpetually cheerful and full of giggles, they're the embodiment of holiday spirit—think caffeine-fueled coders but with eggnog instead of coffee.
Magical Abilities: Subtle enchantments help them fly reindeer or pack sleighs impossibly full, blending old-school mythology's sorcery with modern miracle-making`
  },
  {
    id: 'prompt-enhancer',
    name: 'Prompt Enhancer',
    description: 'Claude enhancement for combined prompts',
    template: `We are trying to enhance an image prompt for an AI image generator.
I would like you to enhance the prompt that I give you.
Use as much detail as you can, important things should appear near the start of the prompt.
Compound words like Star Ship should appear in parenthesis.
500 characters is the max you can use
Create the output in a paragraph format, try to be as pithy as possible.  

Append these words to the start of the max detail prompt.
screen print art, ink color styles, chromatic colors, intricate, ultra fine, render for game engine, 8k.You are a prompt enhancement specialist. Take this combined prompt and enhance it for AI image/video generation. Polish the language, add visual details, and make it flow naturally. Return ONLY the enhanced prompt text, nothing else.

[USER_INPUT]`
  }
];

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
      throw new Error(`Template not found: ${templateId}`);
    }

    return template.template.replace(/\[USER_INPUT\]/g, userInput);
  }

  addTemplate(template: PromptTemplate): void {
    this.templates.push(template);
  }

  removeTemplate(id: string): void {
    this.templates = this.templates.filter(t => t.id !== id);
  }
} 