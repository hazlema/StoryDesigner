# Code Examples & Patterns

This document provides code examples and patterns for using the AI Story Interface effectively.

## Async/Await Support

The Story API automatically wraps your code in an async function, giving you full access to modern JavaScript features including async/await, Promises, and try/catch blocks.

### Automatic Wrapping

Your code is automatically wrapped like this:
```javascript
(async function() {
  // Your code here has access to:
  // - Full ES2017+ features
  // - async/await syntax
  // - Promise support
  // - try/catch error handling
  // - 128MB memory limit
  // - 5-second execution timeout
})();
```

### Using Async Operations

You can use async/await directly in your story code:

```javascript
// Example with async operations
const story = Story.create("Async Adventure");

try {
  // You can use await with any Promise-based operations
  story.addScene("intro")
    .setText("Loading an epic adventure...");
  
  // Media generation happens asynchronously but is handled automatically
  story.generateMedia("epic fantasy castle", "cinematic");
  
  // Complex async logic
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  
  story.addScene("main")
    .setText("The adventure begins now!");
  
  story.link("intro", "main");
  story.publish();
  
  console.log("Story created successfully!");
  
} catch (error) {
  console.error("Error creating story:", error.message);
}
```

### Error Handling

Full try/catch support for robust error handling:

```javascript
const story = Story.create("Error-Safe Story");

try {
  story.addScene("start")
    .setText("This story handles errors gracefully");
  
  // Potentially risky operation
  story.generateMedia("complex description", "experimental-style");
  
  story.publish();
  
} catch (error) {
  console.error("Story creation failed:", error.message);
  
  // Fallback behavior
  console.log("Creating simplified version...");
  story.addScene("fallback")
    .setText("A simpler story that always works");
  story.publish();
}
```

### Advanced Patterns

#### Conditional Story Building
```javascript
const story = Story.create("Dynamic Story");

const userPreference = "fantasy"; // Could come from user input

try {
  story.addScene("start")
    .setText("Choose your adventure type...");
  
  if (userPreference === "fantasy") {
    story.addScene("fantasy_path")
      .setText("You enter a magical realm...")
      .addEvent("fantasy-world.jpg", "autostart");
    
    story.generateMedia("magical fantasy realm", "fantasy");
    story.link("start", "fantasy_path");
    
  } else if (userPreference === "scifi") {
    story.addScene("scifi_path")
      .setText("You board a starship to distant galaxies...")
      .addEvent("starship.jpg", "autostart");
    
    story.generateMedia("futuristic starship bridge", "sci-fi");
    story.link("start", "scifi_path");
  }
  
  story.publish();
  
} catch (error) {
  console.error("Dynamic story creation failed:", error);
}
```

#### Batch Media Generation
```javascript
const story = Story.create("Media-Rich Story");

try {
  // Create multiple scenes first
  story.addScene("forest")
    .setText("You find yourself in a mysterious forest...");
  
  story.addScene("castle")
    .setText("A magnificent castle looms before you...");
  
  story.addScene("dragon")
    .setText("A mighty dragon blocks your path!");
  
  // Generate all media (happens asynchronously)
  const mediaFiles = [
    story.generateMedia("mysterious dark forest", "fantasy"),
    story.generateMedia("medieval stone castle", "fantasy"),
    story.generateMedia("fierce red dragon", "fantasy")
  ];
  
  // Add events with generated media
  story.scenes.forest.addEvent(mediaFiles[0], "on-enter");
  story.scenes.castle.addEvent(mediaFiles[1], "autostart");
  story.scenes.dragon.addEvent(mediaFiles[2], "dramatic-moment");
  
  // Create story flow
  story.link("forest", "castle");
  story.link("castle", "dragon");
  
  story.publish();
  
} catch (error) {
  console.error("Batch creation failed:", error);
}
```

#### Data Processing
```javascript
const story = Story.create("Data-Driven Story");

try {
  // Simulate fetching story data
  const storyData = {
    title: "The Quest",
    scenes: [
      { name: "village", text: "You start in a peaceful village..." },
      { name: "forest", text: "The forest is dark and mysterious..." },
      { name: "treasure", text: "You discover ancient treasure!" }
    ]
  };
  
  // Process data to create story
  for (let i = 0; i < storyData.scenes.length; i++) {
    const scene = storyData.scenes[i];
    
    story.addScene(scene.name)
      .setText(scene.text);
    
    // Generate contextual media
    story.generateMedia(scene.text, "fantasy");
    
    // Link to next scene
    if (i < storyData.scenes.length - 1) {
      const nextScene = storyData.scenes[i + 1];
      story.link(scene.name, nextScene.name);
    }
  }
  
  story.publish();
  console.log(`Created ${storyData.scenes.length} scenes successfully`);
  
} catch (error) {
  console.error("Data processing failed:", error);
}
```

## Memory and Performance Tips

### Memory Management (128MB Limit)
```javascript
// Good: Efficient memory usage
const story = Story.create("Efficient Story");

// Process scenes one at a time instead of storing large arrays
for (let i = 0; i < 10; i++) {
  story.addScene(`scene_${i}`)
    .setText(`This is scene number ${i + 1}`);
  
  // Clean up variables you don't need
  if (i > 0) {
    // Previous scene data is automatically managed
  }
}

story.publish();
```

### Execution Timeout (5 Second Limit)
```javascript
// Good: Fast execution
const story = Story.create("Quick Story");

// Avoid long loops or complex calculations
story.addScene("fast")
  .setText("This story creates quickly!")
  .addEvent("quick-image.jpg", "autostart");

// Media generation is queued and happens after your code completes
story.generateMedia("simple scene", "default");

story.publish();
```

## Debugging Tips

### Console Logging
```javascript
const story = Story.create("Debug Story");

console.log("Starting story creation...");

story.addScene("debug_scene")
  .setText("This scene helps with debugging");

console.log("Scene created successfully");

story.generateMedia("test image", "default");
console.log("Media generation queued");

story.publish();
console.log("Story published!");
```

### Error Information
```javascript
try {
  const story = Story.create("Test Story");
  // ... story creation code
  story.publish();
  
} catch (error) {
  // Detailed error information
  console.error("Error type:", error.name);
  console.error("Error message:", error.message);
  console.error("Stack trace:", error.stack);
}
```

## Best Practices

1. **Use try/catch blocks** for error handling
2. **Log progress** with console.log for debugging
3. **Keep code efficient** to stay within time/memory limits
4. **Generate media early** to allow processing time
5. **Test with simple stories first** before building complex ones
6. **Use descriptive scene names** for easier debugging