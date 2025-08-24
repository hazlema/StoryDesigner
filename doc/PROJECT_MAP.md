# PROJECT_MAP.md

## StoryDesigner Project Architecture Overview

StoryDesigner is a SvelteKit-based interactive story creation platform with AI integration, community features, and a standalone AI interface server. This document provides a comprehensive map of the codebase structure and component relationships.

## Root Level Structure

```
/home/frosty/Dev/svelte/StoryDesigner/
├── 📁 Root Configuration & Documentation
├── 📁 Source Code (src/)
├── 📁 AI Story Interface Server (ai-story-interface/)
├── 📁 Static Assets & Stories (static/)
├── 📁 Marketing Materials (marketing/)
└── 📁 Build Output (build/)
```

---

## 📋 Root Level Files

### Documentation & Configuration
- **CLAUDE.md** - AI assistant guidance and project patterns
- **COMMUNITY.md** - Community hub features and social functionality specification
- **FUTURE.md** - Future enhancements and roadmap items
- **README.md** - Project overview and getting started guide
- **SVELTE5_PATTERNS.md** - Svelte 5 migration patterns and syntax reference
- **money-plan.md** - Monetization strategy and business planning

### Build & Configuration
- **package.json** - Main SvelteKit app dependencies and scripts
- **components.json** - shadcn UI component configuration
- **eslint.config.js** - ESLint configuration for code quality
- **svelte.config.js** - SvelteKit framework configuration
- **tsconfig.json** - TypeScript configuration
- **vite.config.ts** - Vite build tool configuration

---

## 📁 Source Code Structure (`src/`)

### Core Application Files
```
src/
├── app.css           # Global styles and Tailwind imports
├── app.d.ts          # TypeScript ambient declarations
├── app.html          # HTML template for SvelteKit app
├── lib/              # Shared libraries and utilities
└── routes/           # SvelteKit file-based routing
```

### 📚 Library Directory (`src/lib/`)

#### Core Data Models (`lib/classes/`)
- **iStory.ts** - Main story container class with scenes, events, keywords, and metadata
  - File-based storage management
  - Slug generation for URL-safe names
  - CRUD operations via API integration
  - Scene and event relationship management

- **iScene.ts** - Individual story scene representation
  - Text content management
  - Event connections and triggers
  - Scene-to-scene navigation logic

- **iEvent.ts** - Interactive event system
  - Media integration (images, videos, audio)
  - Event triggers and timing
  - Scene transition handling

#### UI Components (`lib/components/`)

##### Core Application Components
- **header.svelte** - Main application header with navigation
- **footer.svelte** - Application footer
- **simple-header.svelte** - Minimal header for community pages
- **simple-footer.svelte** - Minimal footer for community pages
- **sidebar.svelte** - Story navigation and scene management sidebar
- **theme-switcher.svelte** - Dark/light mode toggle

##### Editor Components
- **sceneEditor.svelte** - Rich text editor for story scenes
- **markdownEdit.svelte** - Markdown editing interface
- **mindmap.svelte** - Cytoscape.js-powered story structure visualization
- **MediaList.svelte** - File management and media library

##### AI Integration Components
- **AINotebook.svelte** - Claude AI integration for story assistance
- **FalGenerator.svelte** - Fal.ai image/video generation interface

##### UI Component Library (`lib/components/ui/`)
shadcn UI-inspired component system with Svelte 5 patterns:

**Form Controls:**
- `button/` - Interactive buttons with variants
- `input/` - Text input fields
- `textarea/` - Multi-line text inputs
- `select/` - Dropdown selection components
- `label/` - Form field labels

**Layout Components:**
- `card/` - Content containers with header/body/footer
- `dialog/` - Modal dialogs and overlays
- `sheet/` - Slide-out panels
- `sidebar/` - Navigation sidebar system
- `separator/` - Visual content dividers

**Data Display:**
- `table/` - Data tables with sorting and styling
- `badge/` - Status indicators and tags
- `skeleton/` - Loading state placeholders
- `tooltip/` - Hover information displays
- `breadcrumb/` - Navigation breadcrumbs

#### Configuration & Utilities (`lib/`)
- **config.ts** - Environment-based configuration management
  - Development vs production settings
  - Debug mode controls
  - Story directory configuration

- **utils.ts** - Shared utility functions and helpers

#### Event System (`lib/events/`)
- **eventsHub.ts** - Type-safe event bus for component communication
  - Mindmap interaction events
  - Scene editor state management
  - Story lifecycle events
  - AI integration events
  - Navigation and UI events

- **mindmapHandlers.ts** - Specialized handlers for mindmap interactions
- **index.ts** - Event system exports

#### External Services (`lib/services/`)
- **claude.ts** - Anthropic Claude AI API integration
- **fal.ts** - Fal.ai image/video generation service
- **promptEnhancer.ts** - AI prompt optimization utilities

#### State Management (`lib/stores/`)
- Svelte stores for application state (directory present but contents not detailed)

#### Mobile Support (`lib/hooks/`)
- **is-mobile.svelte.ts** - Mobile device detection and responsive utilities

---

## 🛣️ Routes Structure (`src/routes/`)

### Main Application Routes
- **+layout.svelte** - Root layout with header, sidebar, and theme management
- **+page.svelte** - Home page with story browser and creation interface

### Story Management Routes (`edit/`)
- **+page.svelte** - Story list and selection interface
- **new/+page.svelte** - New story creation form
- **[id]/+page.svelte** - Story editor with mindmap and scene editing
- **[id]/+page.ts** - Story loading logic and data fetching

### Community Features (`community/`)
- **+page.svelte** - Community hub main page
- **components/** - Community-specific UI components:
  - **CommunityLayout.svelte** - Main community layout structure
  - **MainFeed.svelte** - Story discovery and social feed
  - **CategoriesSidebar.svelte** - Genre and category navigation
  - **TrendingSidebar.svelte** - Popular content and trends
  - **WatchDialog.svelte** - Story viewing interface

### Testing Suite (`testing/`)
- **+layout.svelte** - Testing interface layout
- **+page.svelte** - Test suite overview and navigation
- **config/+page.svelte** - Configuration testing interface
- **markdown/+page.svelte** - Markdown editor testing
- **media/+page.svelte** - Media management testing
- **story/+page.svelte** - Story functionality testing
- **template/+page.svelte** - Template system testing

### API Endpoints (`api/`)

#### Core API Routes
- **story/+server.ts** - Story CRUD operations
  - GET: Load story by slug or list all stories
  - POST: Save story data to filesystem
  - DELETE: Remove story and associated files

- **media/+server.ts** - File upload and media management
- **templates/+server.ts** - Story template management

#### AI Integration APIs
- **ai/notebook/+server.ts** - Claude AI integration endpoint
- **fal/+server.ts** - Fal.ai image/video generation proxy

#### Utility APIs
- **story/download/+server.ts** - Story export and download functionality

---

## 🤖 AI Story Interface Server (`ai-story-interface/`)

Standalone Node.js server for real-time AI story collaboration:

### Core Files
- **package.json** - Server dependencies (Express, Socket.io, isolated-vm)
- **server.js** - Main WebSocket server for real-time AI interaction
- **storyAPI.js** - Story manipulation API for AI code execution
- **test-ai.js** - Testing utilities for AI integration
- **Greetings!.md** - Server documentation and examples

### Features
- **Real-time WebSocket Communication** - Live AI collaboration
- **Isolated Code Execution** - Safe JavaScript execution environment
- **Story API Bridge** - Connection between AI and story data
- **Web Interface** - Browser-based testing and interaction

---

## 🗂️ Static Assets (`static/`)

### Story Storage System
```
static/stories/
├── [story-slug]/
│   ├── story.json          # Story data and metadata
│   ├── title.jpg           # Story cover image
│   ├── title.mp4           # Story intro video
│   └── [media-files]       # Associated media assets
```

### Example Stories
- **the-enchanted-forest/** - Sample fantasy story with media
- **the-quantum-badger-chronicles/** - Sci-fi story example
- **a/, abc/** - Simple test stories

### Utility Files
- **play.html** - Standalone story player interface
- **video-events.html** - Video event testing page
- **robots.txt** - Search engine directives

---

## 🎨 Marketing Assets (`marketing/`)

Campaign and promotional materials:
- **campaign.png** - Marketing campaign graphics
- **Elves_Working_On_Computers_Video.mp4** - Promotional video
- **[promotional-images]** - Various marketing graphics

---

## 🏗️ Architecture Flow

### Data Flow Architecture
```
User Interface (Svelte Components)
       ↓
Event Bus (Type-safe communication)
       ↓
Story Classes (Data models)
       ↓
API Endpoints (Server operations)
       ↓
File System (JSON storage)
```

### AI Integration Flow
```
User Input → AI Services (Claude/Fal.ai) → Content Generation → Story Integration
```

### Community Features Flow
```
Story Creation → Community Hub → Social Features → Content Discovery
```

### Testing Infrastructure
```
Component Tests → Integration Tests → API Tests → End-to-End Validation
```

---

## 🔧 Key Technologies

- **Frontend Framework:** SvelteKit with Svelte 5 syntax
- **Styling:** TailwindCSS 4.0 with custom UI components
- **Type Safety:** TypeScript throughout
- **Build Tool:** Vite with SvelteKit adapter
- **Visualization:** Cytoscape.js for story mind maps
- **AI Integration:** Anthropic Claude, Fal.ai
- **Real-time:** Socket.io for live collaboration
- **Security:** Isolated-vm for safe code execution

---

## 🎯 Development Workflow

### Local Development
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Type checking
npm run lint         # Code quality checks
```

### AI Interface Server
```bash
cd ai-story-interface
npm start           # Start WebSocket server
```

---

## 📝 Notes for Developers

### Code Patterns
- **Svelte 5 Syntax:** Uses modern `$props()`, `$state()`, `$derived()` patterns
- **Event-Driven:** Type-safe event bus for component communication
- **File-Based Storage:** Stories stored as JSON in filesystem
- **Modular Components:** Reusable UI component library
- **Type Safety:** Full TypeScript integration

### Key Concepts
- **Story Slug:** URL-safe identifier derived from story name
- **Scene Graph:** Mindmap visualization of story structure
- **Event System:** Interactive elements that trigger media and actions
- **AI Integration:** Multiple AI services for content generation
- **Community Hub:** Social features for story sharing and discovery

### Development Guidelines
- Follow Svelte 5 patterns documented in SVELTE5_PATTERNS.md
- Use the event bus for component communication
- Maintain type safety with TypeScript interfaces
- Test components in the `/testing` route structure
- Follow the established component architecture in `lib/components/ui/`

This PROJECT_MAP.md serves as both a navigation guide and architectural overview for developers and AI assistants working with the StoryDesigner codebase.