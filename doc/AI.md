# AI Help System Implementation

## Overview
This document describes the implementation of a centralized help system for the AI Story Interface that uses shared configuration and reusable file display utilities.

## Gotchas

### Make sure the AI_SHARED_USER_ID in ai-story-interface/.env exists in both the auth table and the users table.  If they do not, they will be unable to use the community.  

Due to constraint issues you will have to create the auth user manually:
	- Add a row to the auth table.
	(if it doesn't work create a new ID and change AI_SHARED_USER_ID to that)

	- Add a row to the users table, when selecting it's ID use the same one as the auth table

	- Set the email to:
	ai@storydesigner.ai
	

## Architecture

### Shared Configuration (`shared-config.cjs`)
- **Purpose**: Single source of truth for paths and settings across both web and AI interfaces
- **Location**: Project root
- **Format**: CommonJS module to avoid ES module conflicts
- **Key Features**:
  - Centralized file paths (help files, stories, queries)
  - AI interface configuration (port, memory limits, timeouts)
  - Environment-based settings

### Display File Utility (`displayFile`)
- **Purpose**: Reusable function to display any file contents via WebSocket
- **Location**: `ai-story-interface/command.ts`
- **Usage**: `displayFile(filePath, socket, fallbackMessage)`
- **Features**:
  - Automatic error handling
  - Fallback message support
  - Works with any file type

### Help System Integration
- **Command**: `/system-help`
- **Implementation**: Uses `displayFile` to show full `Greetings!.md` content
- **Benefits**: 
  - No hardcoded help text
  - Easy to update by editing the markdown file
  - Consistent formatting and comprehensive information

## Usage Examples

```javascript
// Display help file
displayFile(config.paths.helpFile, socket, "Help not available");

// Display any other file
displayFile('/path/to/document.md', socket);
```

## Benefits
- **Maintainable**: Single file to update help content
- **Reusable**: `displayFile` function works for any file display needs
- **Consistent**: Shared config ensures all paths are correct
- **Scalable**: Easy to add more shared resources and file displays