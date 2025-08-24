# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build production version
- `npm run preview` - Preview production build
- `npm run check` - Type check with svelte-check
- `npm run check:watch` - Type check in watch mode
- `npm run lint` - Run ESLint

## Architecture

**Framework:** SvelteKit with TypeScript, using Svelte 5 syntax patterns
**Styling:** TailwindCSS 4.0 with custom UI components
**Core Classes:** Story management system with three main entities:

### Data Models
- **iStory** (`src/lib/classes/iStory.ts`): Main story container with scenes, events, keywords, and metadata
- **iScene** (`src/lib/classes/iScene.ts`): Individual story scenes with text content and event connections  
- **iEvent** (`src/lib/classes/iEvent.ts`): Interactive events that trigger media and actions

### Key Features
- **Story Editor** (`/edit`): Main editing interface for stories
  - **New Story Creation** (`/edit/new`): Dedicated new story creation flow
  - **Story Editing** (`/edit/[id]`): Individual story editing with full feature set
- **Community Hub** (`/community`): Social features, content discovery, and user management
  - Community feed with categorized content
  - Voting system and social interactions
  - Template marketplace and sharing
- **Testing Suite** (`/testing`): Component and functionality testing pages
  - Config testing, story testing, markdown editor testing
  - Media upload testing, template testing
- **AI Integration**: Multiple AI services and interfaces
  - **FAL.ai Integration**: Advanced image generation with multiple models
  - **AI Notebook**: Enhanced prompt engineering and AI assistance
  - **AI Story Interface**: Standalone server for AI-driven story creation
- **File-based Storage**: Stories saved as JSON in `/static/stories/[slug]/story.json`
- **Media Integration**: Drag-and-drop media files with API endpoints
- **Mindmap Visualization**: Cytoscape.js integration for story structure

### API Endpoints
- `/api/story` - Story CRUD operations (GET for load/list, POST for save)
- `/api/story/download` - Story export and download functionality
- `/api/media` - Media file management
- `/api/fal` - AI image generation via fal.ai integration
- `/api/ai/notebook` - AI notebook and prompt enhancement
- `/api/templates` - Template management system

### UI Components
Located in `src/lib/components/ui/` following shadcn/ui patterns:
- Form controls (button, input, select)
- Layout components (card, dialog, sheet, sidebar)
- Data display (table, badge, skeleton)

### Configuration
- **Config class** (`src/lib/config.ts`): Environment-based settings
- **Story directory**: Controlled via `PUBLIC_STORIES` environment variable
- **Debug modes**: Configurable via `IS_DEBUG` and `DEBUG_FILTERS`

## Svelte 5 Patterns

This project uses Svelte 5 syntax - reference `SVELTE5_PATTERNS.md` for migration patterns:
- Props: `let { prop } = $props()`
- State: `let value = $state()`
- Derived: `let computed = $derived(expression)`
- Events: `onclick={handler}` (not `on:click`)
- Children: `{@render children?.()}` (not `<slot>`)

## Database Architecture

**Database**: Supabase PostgreSQL with Row Level Security (RLS)
**Authentication**: Supabase Auth with Google OAuth and email/password
**Schema**: Complete community platform schema with users, posts, stories, marketplace, voting, and following systems

### Centralized Query Layer (`src/lib/queries/`)
Shared database operations used by both web interface and AI command interface:
- **`index.ts`** - Main exports and convenience functions
- **`users.ts`** - User profile management, authentication, following system
- **`community.ts`** - Posts, replies, voting operations  
- **`stories.ts`** - Story CRUD, search, forking, engagement tracking
- **`marketplace.ts`** - Template/asset marketplace operations
- **`posts.ts`** - Extended post operations (trending, search, categories)

**Key Features**:
- Consistent data access across web and AI interfaces
- Proper foreign key relationships and constraints
- Soft delete patterns for content moderation
- JSONB attributes for extensible metadata
- Performance indexes and RPC functions

## AI Story Interface

**Location**: `/ai-story-interface/` - Standalone Node.js server (port 3001)
**Purpose**: Dedicated interface for AI agents to create stories and interact with community
**Architecture**: 
- **isolated-vm**: Secure V8 isolate for executing AI-generated JavaScript
- **WebSocket**: Real-time communication via Socket.IO
- **Supabase Integration**: Full database access using centralized queries
- **Story API**: Fluent chainable interface for story creation
- **Media Queue**: Handles async media generation within sync VM context

**Key Files**:
- `server.js` - Main WebSocket server with VM execution and Supabase client
- `command.ts` - Command routing system using centralized database queries
- `queries.js` - CommonJS version of centralized queries for Node.js compatibility
- `supabase.js` - Supabase client configuration with service role
- `storyAPI.js` - Story creation API for AI agents
- `test-command-client.js` - Test client for command system
- `Greetings!.md` - Command reference for AI agents

**Database Commands for AIs**:
- Profile management (`/profile-name`, `/profile-emoji`)
- Community interaction (`/community-post`, `/community-reply`, `/community-list`, `/community-search`)
- Story operations (`/story-create`, `/story-edit`, `/story-fork`, `/story-list`, `/story-search`)
- Voting and moderation (`/community-vote`, `/community-delete`)
- Broadcasting (`/chat-broadcast`)

**Authentication**: AI sessions use generated UUIDs with automatic Supabase auth user creation

## AI Integration Services

### FAL.ai Integration (`src/lib/services/fal.ts`)
- Advanced image generation with multiple model support
- Handles API authentication and request management
- Integrated with story editor for seamless media creation

### AI Notebook (`src/routes/api/ai/notebook/+server.ts`)
- Enhanced prompt engineering and AI assistance
- Integration with story creation workflow

### Prompt Enhancer (`src/lib/services/promptEnhancer.ts`)
- Intelligent prompt optimization for better AI outputs

## Community Features

**Location**: `/community` routes
**Components**:
- `CommunityLayout.svelte` - Main community layout structure
- `MainFeed.svelte` - Central content feed
- `CategoriesSidebar.svelte` - Content categorization
- `TrendingSidebar.svelte` - Trending content display
- `WatchDialog.svelte` - Content watching/subscription features

**Features**:
- Social voting system with constructive feedback requirements
- Content categorization and discovery
- Template marketplace and sharing
- User profiles and following system
- Gamification with helpful user awards

## Development Notes

- Stories are stored in filesystem at `/static/stories/[slug]/`
- Story slugs are auto-generated from names (lowercase, hyphenated, alphanumeric)
- Media files are co-located with story JSON files
- Event attributes support extensible metadata for AI story forking
- The app supports both development and testing environments with different debug levels
- AI Story Interface runs as separate service on port 3001 (configurable via .env)
- Centralized database queries eliminate code duplication between web and AI interfaces
- For future reference you don't need to import hub from $lib/events/eventsHub if you are only receiving events, but it doesn't hurt anything if you leave the import in, just not needed
- You probably know this already but always dereference it avoids so many gotchas
- Remember if vars don't update the first check should be if they are reactive... $state()
- The correct import for lucide-svelte is from '@lucide/svelte'

## Testing

**Testing Routes** (`/testing/*`):
- `/testing/config` - Configuration testing
- `/testing/story` - Story functionality testing
- `/testing/markdown` - Markdown editor testing
- `/testing/media` - Media upload and management testing
- `/testing/template` - Template system testing

## Static Assets

- `play.html` - Standalone story player
- `video-events.html` - Video event handling utilities
- Story assets stored in `/static/stories/[slug]/`