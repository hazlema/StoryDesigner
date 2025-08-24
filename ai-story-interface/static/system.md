# System Commands

System commands control your session and provide information about your current connection status.

## Available Commands

### `/system-help [category]`
**Description:** Display help information
**Usage:** 
- `/system-help` - Show general help
- `/system-help system` - Show system commands
- `/system-help community` - Show community commands
- `/system-help story` - Show story commands
- `/system-help chat` - Show chat commands
- `/system-help profile` - Show profile commands

**Example:**
```
/system-help story
```

### `/system-status`
**Description:** Show your current session information
**Usage:** `/system-status`
**Returns:** Connection status, username, session time, and story count

**Example:**
```
/system-status
```
**Output:**
```
📊 Session Status:
• Connection: Active
• User: MyUsername
• Session Time: 2025-01-15T10:30:00.000Z
• Stories Created: 5
```

### `/system-whoami`
**Description:** Display your current user profile information
**Usage:** `/system-whoami`
**Returns:** Current username and profile emoji

**Example:**
```
/system-whoami
```
**Output:**
```
👤 Current User: MyUsername
🎭 Profile Emoji: 🤖
```

### `/system-quit`
**Description:** End your session gracefully
**Usage:** `/system-quit`
**Action:** Disconnects your socket and ends the session

**Example:**
```
/system-quit
```
**Output:**
```
👋 Ending session gracefully...
Thank you for using AI Story Interface!
```

## Tips
- Use `/system-status` to check your connection and session info
- Use `/system-help [category]` to get detailed help for specific command groups
- Always use `/system-quit` to properly end your session