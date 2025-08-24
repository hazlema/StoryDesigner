# Story Commands

Story commands are the core of the AI Story Interface, allowing you to create, edit, share, and collaborate on interactive stories using JavaScript code.

## Available Commands

### `/story-create <javascript_code>`
**Description:** Create a new story using the Story API
**Usage:** `/story-create \`javascript code here\``
**Parameters:**
- `javascript_code` (required) - Complete JavaScript code using the Story API

**Example:**
```
/story-create `
const story = Story.create("The Quantum Badger Adventures");

story.addScene("start")
  .setText("A badger discovers quantum mechanics...")
  .addEvent("badger-lab.jpg", "autostart");

story.addScene("discovery")
  .setText("The badger realizes it can exist in multiple states!")
  .addEvent("quantum-badger.jpg", "on-enter");

story.generateMedia("quantum physics badger scientist", "cinematic");
story.generateMedia("parallel universe laboratory", "sci-fi");

story.link("start", "discovery");
story.publish();
`
```

### `/story-edit <story_slug> <javascript_code>`
**Description:** Edit an existing story
**Usage:** `/story-edit my-story-slug \`new javascript code\``
**Parameters:**
- `story_slug` (required) - The slug identifier of the story to edit
- `javascript_code` (required) - Updated JavaScript code

**Example:**
```
/story-edit quantum-badger-adventures `
// Add a new scene to existing story
story.addScene("conclusion")
  .setText("The badger saves the multiverse!")
  .addEvent("hero-badger.jpg", "dramatic-moment");
`
```

### `/story-list`
**Description:** List your recent stories
**Usage:** `/story-list`
**Returns:** A list of stories you've created with their details

**Example:**
```
/story-list
```

### `/story-read <story_slug>`
**Description:** Read/experience a story
**Usage:** `/story-read quantum-badger-adventures`
**Parameters:**
- `story_slug` (required) - The slug identifier of the story to read

**Example:**
```
/story-read quantum-badger-adventures
```

### `/story-search "keyword"`
**Description:** Search for stories by keyword
**Usage:** `/story-search "quantum"`
**Parameters:**
- `keyword` (required) - Search term to find in story titles and content

**Example:**
```
/story-search "badger"
```

### `/story-fork <original_slug> <new_title>`
**Description:** Create a variation of an existing story
**Usage:** `/story-fork quantum-badger-adventures "Quantum Hamster Chronicles"`
**Parameters:**
- `original_slug` (required) - The slug of the story to fork
- `new_title` (required) - Title for your forked version

**Example:**
```
/story-fork quantum-badger-adventures "The Quantum Badger: Time Travel Edition"
```

## Story API Reference

### Creating Stories
```javascript
const story = Story.create("Story Title");
```

### Adding Scenes
```javascript
// Basic scene
story.addScene("scene_name");

// Scene with text
story.addScene("scene_name")
  .setText("Your story text here...");

// Scene with events
story.addScene("scene_name")
  .setText("Story text...")
  .addEvent("media-file.jpg", "trigger-type");
```

### Event Triggers
- `"autostart"` - Triggers immediately when scene loads
- `"on-enter"` - Triggers when player enters the scene
- `"on-click"` - Triggers when player clicks
- `"dramatic-moment"` - Triggers at a specific dramatic point

### Generating Media
```javascript
// Basic media generation
story.generateMedia("description of image", "style-template");

// Style templates
story.generateMedia("epic dragon", "fantasy");
story.generateMedia("space station", "sci-fi");
story.generateMedia("detective office", "noir");
story.generateMedia("quantum laboratory", "cinematic");
```

### Linking Scenes
```javascript
// Create story flow
story.link("scene1", "scene2");
story.link("scene2", "scene3");

// Multiple paths
story.link("choice_scene", "path_a");
story.link("choice_scene", "path_b");
```

### Publishing
```javascript
// Publish the completed story
story.publish();
```

## Advanced Patterns

### Branching Narratives
```javascript
const story = Story.create("Choose Your Adventure");

story.addScene("start")
  .setText("You find a mysterious door. What do you do?");

story.addScene("open_door")
  .setText("You open the door and find...");

story.addScene("ignore_door")
  .setText("You walk away, but hear a strange sound...");

story.link("start", "open_door");
story.link("start", "ignore_door");
```

### Media-Rich Stories
```javascript
const story = Story.create("Visual Journey");

story.addScene("intro")
  .setText("Welcome to an immersive experience...")
  .addEvent("opening-scene.jpg", "autostart");

// Generate multiple related images
story.generateMedia("mysterious forest entrance", "fantasy");
story.generateMedia("ancient stone archway", "fantasy");
story.generateMedia("glowing mystical portal", "fantasy");

story.publish();
```

## Best Practices
- **Plan your story structure** before coding
- **Use descriptive scene names** for easier navigation
- **Generate media that enhances** the narrative
- **Test story flow** with different paths
- **Add meaningful event triggers** for interactivity
- **Keep scenes focused** on single story beats

## Tips
- Stories are automatically saved with URL-friendly slugs
- Media generation is asynchronous but handled automatically
- You can fork any public story to create variations
- Use `/story-search` to discover inspiration from other creators
- Story code supports full ES2017+ JavaScript features