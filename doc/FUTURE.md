# Future Enhancements & Ideas

## Fal.ai Generator Improvements

### Advanced Parameters Panel
- Add "Advanced" button to prompt dialog
- Expose all model-specific parameters (guidance_scale, num_inference_steps, safety_tolerance, etc.)
- Allow users to tweak generation settings without code changes
- Collapsible/expandable interface to keep UI clean

### Service Integration Simplification
- The current model config system is complex for adding new services
- Consider abstracting the model definitions into a more declarative format
- Maybe a plugin-style architecture for different AI services

## UI/UX Polish

### Animation Refinements
- ~~Current template preview animation could be smoother~~
- Consider adding more micro-interactions throughout the app
- ~~Loading states and transitions need attention~~

### Template System
- ~~Template editor interface for creating custom enhancement prompts~~
- Import/export template collections
- User presets system for custom templates
- Template marketplace for browsing and trying community templates

## Architecture Improvements

### Event System
- ~~The EventBus is working great, consider expanding it~~
- ~~Add event logging/debugging interface~~
- Event replay for development/testing

### Story Management
- Better file organization as projects grow
- ~~Story templates and presets~~
- Version control integration

## Near-Term Features

### Authentication & Credit System
- ~~Supabase auth Google~~ github
- Credit balance tracking per user
- ~~Security checks in +layout.svelte for AI feature gating~~
- Freemium model: free basic features, credits for AI
- Cost estimation system for different API providers
- ~~Usage tracking~~ and limits

### File Upload System
- API route for file uploads (images, videos, audio)
- File management interface
- Integration with existing media system

### Node Connections & Visual Flow
- Implement visual connections between story nodes
- Connection drawing/editing interface
- Flow visualization in mindmap view
- Connection logic and validation

### Node Details Enhancement
- Add AI media generation to double-click node details
- Combine upload + AI generation in single interface
- Quick media assignment to story events

## New Features

### Content Pipeline
- Batch generation queue improvements
- Auto-retry failed generations
- Export formats (PDF, EPUB, etc.)

### AI Integration
- ~~Multiple AI provider support (OpenAI, Anthropic, local models)~~
- ~~AI-powered story structure suggestions~~ (more work needed)
- Character consistency across generations (hard) 
	- probably going to have to add the ability to upload ref images

### Story Flow Management
- ~~Visual story paths and branching~~
- Connection types (sequence, choice, conditional)
- Story flow validation and testing

### Community Hub
- Share images, videos, and other media
- Exchange tips and techniques
- User ratings and reviews
- Featured content curation
- Community challenges and contests

### Social Sharing
- Generate shareable cards for stories
- Post directly to social media platforms
- Links redirect to /play/[story-slug]
- Rich embed support with Open Graph meta tags
- Twitter/X card metadata
- Custom preview images for each story
- Title, description, and thumbnail customization


# Next Version

## Architecture: 
- Bun replaces node for several reasons
	- Built in file access, express server built in, one-line file io

- DaisyUI replaces shad
	- Daisy has a small footprint and svelte native components

## Unified Socket Architecture (Next Version)

### Core Concept: Real-Time Collaborative Storytelling
Transform the application into a truly unified socket-based system where both web frontend and AI interface use the same command layer for all operations.

### Architectural Evolution
**Current State:**
- Web UI → Direct database calls
- AI Interface → Socket commands → Database calls

**Future Vision:**
- Web UI → Socket commands → Database calls  
- AI Interface → Socket commands → Database calls
- **Result:** Single source of truth with real-time synchronization

### Multi-Author Collaborative Stories

#### The Ultimate Creative Experience
Multiple creators (both humans and AIs) working simultaneously on different sections of the same story, each contributing their unique strengths:

- **Human writers** - Emotional depth, character development, dialogue nuance
- **AI assistants** - World-building, environmental descriptions, plot consistency
- **Specialized AIs** - Genre expertise (sci-fi physics, fantasy lore, historical accuracy)
- **Human editors** - Narrative flow, pacing, final polish

#### Real-Time Collaboration Features
- **Live mindmap updates** - Visual story structure changes as anyone adds/modifies scenes
- **Section ownership** - Different creators can claim and develop specific story branches
- **Conflict resolution** - Smart merging when multiple authors work on connected sections
- **Version branching** - Ability to explore different narrative paths simultaneously
- **Command audit trail** - Full history of who contributed what and when

#### Creative Possibilities
- **Emergent storytelling** - Narratives that emerge from the collaborative process, impossible for any single author to conceive
- **Cross-perspective narratives** - Stories told from multiple viewpoints by different creators simultaneously
- **Genre fusion** - Human creativity combined with AI knowledge creating entirely new narrative forms
- **Real-time reader engagement** - Audience participation in story development through voting and suggestions

### Technical Implementation
- **Event-driven architecture** - All story modifications become socket events
- **Consistent validation** - Same business logic and command system for all users
- **Live synchronization** - Every participant sees changes in real-time
- **Collaborative conflict resolution** - Smart handling of simultaneous edits
- **Performance optimization** - Efficient real-time updates for large collaborative sessions

### Social & Creative Impact
This represents a fundamental shift from traditional authorship to **distributed creativity** - a new form of creative expression that could only exist through true human-AI collaboration. Stories become living documents, evolving through the collective intelligence and creativity of diverse minds working in harmony.

### Development Philosophy
Ship the current version to learn, then build toward this collaborative future. The socket architecture and command system being developed now provides the perfect foundation for these advanced collaborative features.

---

*The best stories are the ones no single mind could have imagined alone.*
*Add ideas here as they come up during development*