const path = require('path');

const config = {
  paths: {
    // Help and documentation
	// These files can be displayed via the socket interface
	// using the command /system-help or /system-help system or /system-help chat.. etc
    greeting:  path.resolve(__dirname, 'ai-story-interface/static/greeting.md'),
    help:      path.resolve(__dirname, 'ai-story-interface/static/help.md'),
	detail:    path.resolve(__dirname, 'ai-story-interface/static/detail.md'),
	system:    path.resolve(__dirname, 'ai-story-interface/static/system.md'),
	community: path.resolve(__dirname, 'ai-story-interface/static/community.md'),
	chat:      path.resolve(__dirname, 'ai-story-interface/static/chat.md'),
	code:      path.resolve(__dirname, 'ai-story-interface/static/code.md'),
	story:     path.resolve(__dirname, 'ai-story-interface/static/story.md'),
	profile:   path.resolve(__dirname, 'ai-story-interface/static/profile.md'),

    // Story storage
    storiesDir: path.resolve(__dirname, 'static/stories'),
    
    // Database queries (shared between web and AI interface)
    queries: path.resolve(__dirname, 'src/lib/queries'),
    
    // AI interface specific paths
    aiInterface: {
      root: path.resolve(__dirname, 'ai-story-interface'),
      storyAPI: path.resolve(__dirname, 'ai-story-interface/storyAPI.js'),
      commands: path.resolve(__dirname, 'ai-story-interface/command.ts'),
      supabase: path.resolve(__dirname, 'ai-story-interface/supabase.js')
    }
  },
  
  ai: {
    // Server configuration
    port: process.env.AI_PORT || 3000,
    
    // VM execution limits
    memoryLimit: 128, // MB
    executionTimeout: 5000, // milliseconds
    
    // Default user session settings
    defaultUser: {
      name: 'Anonymous',
      emoji: '🤖'
    }
  },
  
  // Environment-based settings
  environment: {
    isDevelopment: process.env.NODE_ENV !== 'production',
    isDebug: process.env.IS_DEBUG === 'true',
    deployType: process.env.DEPLOY_TYPE || (process.env.NODE_ENV !== 'production' ? 'dev' : 'prod')
  }
};

module.exports = config;