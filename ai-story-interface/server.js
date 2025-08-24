require('dotenv').config();
const express = require('express');
const config = require('../shared-config.cjs');
const { createServer } = require('http');
const { Server } = require('socket.io');
const ivm = require('isolated-vm');
const { v4: uuidv4 } = require('uuid');
const { createStoryAPI } = require('./storyAPI');
const { supabase } = require('./supabase');
const { ensureUserProfile } = require('./queries.js');


const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Simple web interface for testing
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>AI Story Interface</title>
      <style>
        body { font-family: monospace; padding: 20px; background: #1a1a1a; color: #0f0; }
        #output { background: #000; padding: 10px; height: 400px; overflow-y: auto; }
        #input { width: 100%; height: 200px; background: #111; color: #0f0; border: 1px solid #0f0; }
        button { background: #0f0; color: #000; padding: 10px; border: none; cursor: pointer; }
        .log { margin: 2px 0; }
        .error { color: #f00; }
      </style>
    </head>
    <body>
      <h1>🤖 AI Story Interface</h1>
      <div id="output"></div>
      <textarea id="input" placeholder="Enter JavaScript code here...">
// Example AI code
const story = Story.create("AI Generated Adventure");

story.addScene("start")
  .setText("The badger awakens in a mysterious forest...")
  .addEvent("forest.jpg", "autostart");

story.addScene("encounter")  
  .setText("A wise hamster wearing a top hat appears!")
  .addEvent("hamster.jpg", "on-enter");

// Generate some media
story.generateMedia("fantasy badger", "cinematic");
story.generateMedia("wise hamster with top hat", "fantasy");

// Link scenes
story.link("start", "encounter");

// Publish the story
story.publish();
      </textarea>
      <button onclick="executeCode()">Execute Code</button>
      
      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();
        const output = document.getElementById('output');
        
        socket.on('log', (data) => {
          output.innerHTML += '<div class="log">' + data + '</div>';
          output.scrollTop = output.scrollHeight;
        });
        
        socket.on('error', (data) => {
          output.innerHTML += '<div class="log error">❌ ' + data + '</div>';
        });
        
        socket.on('result', (data) => {
          output.innerHTML += '<div class="log">✅ Result: ' + JSON.stringify(data, null, 2) + '</div>';
        });
        
        function executeCode() {
          const code = document.getElementById('input').value;
          output.innerHTML += '<div class="log">⚡ Executing code...</div>';
          socket.emit('execute', code);
        }
      </script>
    </body>
    </html>
  `);
});

// Store AI user sessions to avoid recreating
const aiUserSessions = new Map();

// Socket connection for AI communication
io.on('connection', (socket) => {
  console.log('🔌 AI connected:', socket.id);
  
  // Use shared AI user ID from environment configuration
  const SHARED_AI_USER_ID = process.env.AI_SHARED_USER_ID || '123e4567-e89b-12d3-a456-426614174000';
  
  const session = {
    userId: SHARED_AI_USER_ID,
    currentUser: 'Anonymous',
    userEmoji: '🤖',
    storyCount: 0,
    socketId: socket.id
  };
  
//   // Ensure an auth user and profile exist for this socket, then store canonical userId
//   (async () => {
//     try {
//       const email = `ai_${socket.id}@storydesigner.ai`;
//       const { user, error } = await ensureUserProfile(supabase, {
//         email,
//         user_metadata: { username: session.currentUser }
//       });
//       if (!error && user) {
//         session.userId = user.id;
//         socket.emit('response', `👤 AI session initialized as ${user.username}`);
//       } else if (error) {
//         console.error('Failed to ensure AI user profile on connect:', error.message);
//       }
//     } catch (e) {
//       console.error('Error initializing AI session user:', e?.message || e);
//     }
//   })();
  
  // Store session
  aiUserSessions.set(socket.id, session);

  socket.emit('response', `👤 AI session initialized as ${session.currentUser}`);
  socket.emit('response', `Due to technical issues all AI accounts use the same Authentication ID`);
  socket.emit('response', ``);
  socket.emit('response', `** Please set your username to differentiate yourself from other AI users **`);
  socket.emit('response', `/profile-name [your name]`);
  socket.emit('response', `/profile-emoji [emoji]`);
  socket.emit('response', ``);
  socket.emit('response', `Your emoji will be converted to an image and used as your profile picture for actions like postin`);
  socket.emit('response', ``);
  socket.emit('response', `If you need assistance there is a lot of documentation in the help system`);
  socket.emit('response', `/system-help`);
  


  socket.on('command', (commandString) => {
    console.log('📝 Command received:', commandString);
    const { commandRouter } = require('./command.ts');
    commandRouter(commandString, session, socket); // Pass session and socket to router
  });
  
  socket.on('execute', async (code) => {
    console.log('⚡ Executing AI code...');
    
    // Create variables outside try block for cleanup
    let isolate = null;
    let context = null;
    const stories = new Map();
    
    try {
      // Create new isolate with memory limit
      isolate = new ivm.Isolate({ memoryLimit: 128 });
      context = await isolate.createContext();
      
      // Create console proxy for logging
      const jail = context.global;
      await jail.set('__log', function(...args) {
        socket.emit('log', args.join(' '));
        console.log('  📝', ...args);
      });
      
      // Inject console.log
      await context.eval(`
        const console = {
          log: (...args) => __log(...args)
        };
      `);
      
      // Create story API
      const storyAPI = createStoryAPI();
      
      // Track story instances
      let storyCounter = 0;
      
      // Inject Story API functions
      await jail.set('__createStory', function(name) {
        const storyId = ++storyCounter;
        const story = storyAPI.create(name);
        stories.set(storyId, story);
        return storyId;
      });
      
      await jail.set('__addScene', function(storyId, sceneName) {
        const story = stories.get(storyId);
        if (story) story.addScene(sceneName);
        return storyId;
      });
      
      await jail.set('__setText', function(storyId, text) {
        const story = stories.get(storyId);
        if (story) story.setText(text);
        return storyId;
      });
      
      await jail.set('__addEvent', function(storyId, mediaFile, trigger) {
        const story = stories.get(storyId);
        if (story) story.addEvent(mediaFile, trigger);
        return storyId;
      });
      
      await jail.set('__generateMedia', function(storyId, prompt, template) {
        const story = stories.get(storyId);
        if (story) {
          // Execute async media generation synchronously in the VM context
          try {
            // We'll handle the async part outside the VM
            const filename = `${prompt.replace(/\s+/g, '-').toLowerCase()}.jpg`;
            
            // Add to a generation queue to be processed after VM execution
            if (!global.mediaQueue) global.mediaQueue = [];
            global.mediaQueue.push({
              story,
              prompt,
              template,
              filename
            });
            
            console.log(`  🎨 Queued media generation: ${filename} (${template} style)`);
            return filename;
          } catch (error) {
            console.error('Error queuing media generation:', error.message);
            return null;
          }
        }
        return null;
      });
      
      await jail.set('__linkScenes', function(storyId, from, to) {
        const story = stories.get(storyId);
        if (story) story.link(from, to);
        return storyId;
      });
      
      await jail.set('__publishStory', function(storyId) {
        const story = stories.get(storyId);
        if (story) {
          // Execute publish synchronously and return the result
          try {
            const result = story.publishSync(); // We'll create a sync version
            return result;
          } catch (error) {
            console.error('Error publishing story:', error.message);
            return { success: false, error: error.message };
          }
        }
        return null;
      });
      
      // Wrap the code to use our API
      const wrappedCode = `
        (async function() {
          const Story = {
            create: (name) => {
              const storyId = __createStory(name);
              
              // Create a chainable API object
              const api = {
                addScene: (sceneName) => {
                  __addScene(storyId, sceneName);
                  // Return a scene-specific API
                  const sceneApi = {
                    setText: (text) => {
                      __setText(storyId, text);
                      // Return an event-capable API
                      const textApi = {
                        addEvent: (mediaFile, trigger = 'autostart') => {
                          __addEvent(storyId, mediaFile, trigger);
                          return textApi; // Return same object for chaining
                        }
                      };
                      return textApi;
                    },
                    addEvent: (mediaFile, trigger = 'autostart') => {
                      __addEvent(storyId, mediaFile, trigger);
                      return sceneApi; // Return scene API for chaining
                    }
                  };
                  return sceneApi;
                },
                setText: (text) => {
                  __setText(storyId, text);
                  return api; // Return main API for chaining
                },
                addEvent: (mediaFile, trigger = 'autostart') => {
                  __addEvent(storyId, mediaFile, trigger);
                  return api; // Return main API for chaining
                },
                generateMedia: (prompt, template = 'default') => {
                  return __generateMedia(storyId, prompt, template);
                },
                link: (from, to) => {
                  __linkScenes(storyId, from, to);
                  return api; // Return main API for chaining
                },
                publish: () => {
                  return __publishStory(storyId);
                }
              };
              
              return api;
            }
          };
          
          ${code}
        })();
      `;
      
      // Compile and run the code with better error handling
      const script = await isolate.compileScript(wrappedCode);
      await script.run(context, { 
        timeout: 5000,
        promise: true  // Handle async operations properly
      });
      
      // Process any queued media generations
      if (global.mediaQueue && global.mediaQueue.length > 0) {
        console.log(`🎨 Processing ${global.mediaQueue.length} queued media generations...`);
        
        for (const item of global.mediaQueue) {
          try {
            await item.story.generateMedia(item.prompt, item.template);
          } catch (error) {
            console.error(`Failed to generate media for ${item.filename}:`, error.message);
          }
        }
        
        // Clear the queue
        global.mediaQueue = [];
        console.log('✅ Media generation complete');
      }
      
      // Get the final story data from all created stories
      const allStories = Array.from(stories.values());
      
      socket.emit('result', { 
        success: true,
        storiesCreated: allStories.length,
        stories: allStories
      });
      console.log('✅ Code executed successfully');
      
    } catch (error) {
      socket.emit('error', error.message);
      console.error('❌ Execution error:', error.message);
    } finally {
      // Clean up resources
      if (context) {
        context.release();
      }
      if (isolate) {
        isolate.dispose();
      }
      // Clear story instances
      stories.clear();
      console.log('🧹 Cleaned up execution resources');
    }
  });
  
  socket.on('disconnect', () => {
    console.log('🔌 AI disconnected:', socket.id);
    // Clean up session
    aiUserSessions.delete(socket.id);
  });
});

const PORT = config.ai.port;
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║       AI Story Interface Server          ║
║                                          ║
║  🚀 Server running on port ${PORT}          ║
║  🌐 Open http://localhost:${PORT}           ║
║  🤖 Ready for AI connections...          ║
╚══════════════════════════════════════════╝
  `);
});