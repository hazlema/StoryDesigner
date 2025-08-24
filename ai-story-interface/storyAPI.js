// Real Story API - Creates actual StoryDesigner story files
const fs = require('fs');
const path = require('path');

// Story data structures matching the TypeScript interfaces
class StoryEvent {
  constructor(key, event, source, media, attributes = {}) {
    this.key = key;
    this.event = event; // 'autostart' | 'after'
    this.source = source;
    this.media = media;
    this.attributes = attributes;
  }
}

class StoryScene {
  constructor(key, text, events = [], connections = []) {
    this.key = key;
    this.text = text;
    this.events = events;
    this.connections = connections;
  }

  addEvent(event) {
    this.events.push(event);
    return this;
  }

  addConnection(connectionKey) {
    if (!this.connections.includes(connectionKey)) {
      this.connections.push(connectionKey);
    }
    return this;
  }
}

// Main Story class matching StoryDesigner's iStory structure
class Story {
  constructor(name, description = '') {
    this.name = name;
    this.description = description;
    this.keywords = [];
    this.isLocked = false;
    this.events = [];
    this.scenes = [];
    this.mindmap = {};
    this.attributes = {};
    this.currentScene = null;
    this.media = []; // Track generated media files
    console.log(`📖 Story created: ${name}`);
  }

  get slug() {
    return this.name
      .toLowerCase()
      .trim()
      .replace(/ /g, '-')
      .replace(/[^0-9a-z-]/g, '');
  }

  addScene(sceneName) {
    const scene = new StoryScene(sceneName, '', [], []);
    this.scenes.push(scene);
    this.currentScene = scene;
    console.log(`  📝 Added scene: ${sceneName}`);
    return this;
  }

  setText(text) {
    if (this.currentScene) {
      this.currentScene.text = text;
      console.log(`  ✏️  Set text: ${text.substring(0, 50)}...`);
    }
    return this;
  }

  addEvent(mediaFile, trigger = 'autostart') {
    if (this.currentScene) {
      // Create a unique event key
      const eventKey = `${this.currentScene.key}_${mediaFile.replace(/\.[^/.]+$/, "")}_${Date.now()}`;
      
      // Create the event following StoryDesigner structure
      const event = new StoryEvent(
        eventKey,
        trigger === 'autostart' ? 'autostart' : 'after',
        this.currentScene.key, // source is the scene key
        mediaFile,
        {}
      );
      
      // Add to both scene and story events
      this.currentScene.addEvent(event);
      this.events.push(event);
      
      console.log(`  🎬 Added event: ${mediaFile} (${trigger})`);
    }
    return this;
  }

  link(fromScene, toScene) {
    const from = this.scenes.find(s => s.key === fromScene);
    const to = this.scenes.find(s => s.key === toScene);
    if (from && to) {
      from.addConnection(toScene);
      console.log(`  🔗 Linked: ${fromScene} → ${toScene}`);
    }
    return this;
  }

  async generateMedia(prompt, template = 'default') {
    // Generate a filename based on the prompt
    const filename = `${prompt.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    
    try {
      console.log(`  🎨 Generating real media: ${filename} (${template} style)`);
      
      // Enhance prompt based on template
      let enhancedPrompt = prompt;
      const templates = {
        'cinematic': `cinematic shot of ${prompt}, dramatic lighting, movie still, high quality, detailed`,
        'fantasy': `fantasy art style, ${prompt}, magical atmosphere, vibrant colors, detailed artwork`,
        'dramatic': `dramatic scene of ${prompt}, intense mood, dynamic composition, high contrast`,
        'default': prompt
      };
      
      enhancedPrompt = templates[template] || templates['default'];
      
      // Call the main app's Fal.ai API
      const response = await fetch('http://localhost:5173/api/fal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'generateImageKontext',
          prompt: enhancedPrompt,
          aspect_ratio: '16:9',
          num_images: 1
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.result.images && data.result.images.length > 0) {
        const imageUrl = data.result.images[0].url;
        
        // Download the image to the story directory
        const imageResponse = await fetch(imageUrl);
        const imageBuffer = await imageResponse.arrayBuffer();
        
        // Get the stories directory
        const path = require('path');
        const storiesDir = process.env.PUBLIC_STORIES || path.join(process.cwd(), '..', 'static', 'stories');
        const storyDir = path.join(storiesDir, this.slug);
        const imagePath = path.join(storyDir, filename);
        
        // Save the image file
        const fs = require('fs');
        if (!fs.existsSync(storyDir)) {
          fs.mkdirSync(storyDir, { recursive: true });
        }
        fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
        
        console.log(`  🖼️  Downloaded real image: ${filename}`);
        console.log(`  🌐 Original URL: ${imageUrl}`);
        
        this.media.push({
          prompt,
          template,
          file: filename,
          originalUrl: imageUrl
        });
        
        return filename;
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error(`❌ Failed to generate real media: ${error.message}`);
      console.log(`  📝 Creating placeholder instead: ${filename}`);
      
      // Fallback to placeholder
      this.media.push({
        prompt,
        template,
        file: filename,
        error: error.message
      });
      
      // Create placeholder file
      const path = require('path');
      const fs = require('fs');
      const storiesDir = process.env.PUBLIC_STORIES || path.join(process.cwd(), '..', 'static', 'stories');
      const storyDir = path.join(storiesDir, this.slug);
      const mediaPath = path.join(storyDir, filename);
      
      if (!fs.existsSync(storyDir)) {
        fs.mkdirSync(storyDir, { recursive: true });
      }
      
      fs.writeFileSync(mediaPath, `# Placeholder for: ${prompt}\n# Template: ${template}\n# Error: ${error.message}`);
      
      return filename;
    }
  }

  addKeyword(keyword) {
    if (!this.keywords.includes(keyword)) {
      this.keywords.push(keyword);
    }
    return this;
  }

  publishSync() {
    console.log(`\n✅ Publishing story: ${this.name}`);
    
    try {
      // Get the stories directory (matching main app's structure)
      const storiesDir = process.env.PUBLIC_STORIES || path.join(process.cwd(), '..', 'static', 'stories');
      const storyDir = path.join(storiesDir, this.slug);
      const storyFile = path.join(storyDir, 'story.json');
      
      // Ensure directory exists
      if (!fs.existsSync(storyDir)) {
        fs.mkdirSync(storyDir, { recursive: true });
        console.log(`  📁 Created directory: ${storyDir}`);
      }
      
      // Prepare story data in the exact format expected by StoryDesigner
      const storyData = {
        name: this.name,
        description: this.description,
        keywords: this.keywords,
        isLocked: this.isLocked,
        events: this.events,
        scenes: this.scenes,
        mindmap: this.mindmap,
        attributes: this.attributes
      };
      
      // Write story file
      fs.writeFileSync(storyFile, JSON.stringify(storyData, null, 2));
      console.log(`  💾 Saved story file: ${storyFile}`);
      
      // Create placeholder media files (in a real implementation, these would be generated)
      for (const mediaItem of this.media) {
        const mediaPath = path.join(storyDir, mediaItem.file);
        if (!fs.existsSync(mediaPath)) {
          // Create a placeholder file (in reality, this would be generated media)
          fs.writeFileSync(mediaPath, `# Placeholder for: ${mediaItem.prompt}\n# Template: ${mediaItem.template}`);
          console.log(`  🖼️  Created media placeholder: ${mediaItem.file}`);
        }
      }
      
      console.log(`   📊 Scenes: ${this.scenes.length}`);
      console.log(`   🎬 Events: ${this.events.length}`);
      console.log(`   🎨 Media: ${this.media.length}`);
      console.log(`   📂 Path: ${storyFile}`);
      
      return {
        success: true,
        story: {
          name: this.name,
          slug: this.slug,
          path: storyFile,
          scenes: this.scenes.length,
          events: this.events.length,
          media: this.media.length
        }
      };
    } catch (error) {
      console.error(`❌ Failed to publish story: ${error.message}`);
      throw error;
    }
  }

  // Keep async version for compatibility
  async publish() {
    return this.publishSync();
  }
}

// Factory function to create stories
function createStoryAPI() {
  return {
    create: (name, description) => new Story(name, description)
  };
}

module.exports = { createStoryAPI, Story, StoryScene, StoryEvent };