# Community Hub Features

## Overview
The Community Hub is the central social and account management area of StoryDesigner. It combines content discovery, social features, and user account management in one unified space.

## Core Architecture
- **Location**: `/community/*` routes within main app
- **Backend**: Supabase for auth, database, and storage
- **Integration**: Seamless connection with story editor and player

## Main Feed Features

### Category-Based Organization
- Stories categorized by genre/type
- Trending content per category
- Prevents content overwhelming
- Targeted discovery for user interests
- All posts no matter what category will have a unique id

### New Completed Stories Section
- Auto-populated when stories marked complete
- Fresh daily content stream
- No submission needed - automatic
- Drives daily engagement
- Free users can bookmark and browse without subscription

## Social Features

### Voting System
- **Thumbs Up**: Simple positive reinforcement
- **Thumbs Down**: Requires written feedback
  - Prevents drive-by negativity
  - Provides constructive criticism
  - Helps authors improve
  - Builds positive community culture

### Gamification

#### Most Helpful User Award
- **Monthly competition** for best feedback provider
- **Prize**: 50 credits (~$50 value)
- **Tracking metrics**:
  - Upvotes on feedback comments
  - "This helped me" clicks from authors
  - Consistency of participation
  - Quality/depth of feedback
- **Benefits**:
  - Creates volunteer community moderators
  - Incentivizes quality over quantity
  - Builds invested user base
  - Free QA testing for stories

#### Leaderboards
- Top 10 helpful users
- Feedback count tracking
- "Helped" scores
- Badge system:
  - "Constructive Critic"
  - "Daily Helper" 
  - "Template Guru"
  - "Story Master"

### Additional Features
- **Story of the Day**: Featured content spot
- **Completion Streaks**: Gamify finishing stories
- **Author Following**: Get notified of new stories
- **Content Categories**:
  - Quick Reads (under 5 min)
  - Epic Adventures (30+ min)
  - Interactive Puzzles
  - Community Challenges

## Account Management

### Integrated User Dashboard
- Profile settings
- Credit balance tracking
- Subscription management
- Usage statistics
- Published stories list
- Received feedback
- Given feedback history

### Subscription Tiers (Managed Here)
- **Base Tier**: AI assistance + image generation
- **Pro Tier ($50)**: Limited video generation
- **Super Tier ($100)**: Extensive video ($0.75/second)

## User Presets & Template Marketplace

### User Presets
- Save custom prompt templates
- Share with community
- Import/export collections

### Template Marketplace

#### Economic Strategy (Two-Phase Launch)

**Phase 1 - Bootstrap/MVP (Pre-Investment)**
- All templates FREE (price = 0)
- Focus on user adoption and template quality
- Build creator habits and community engagement
- Prove product-market fit with usage metrics
- Goal: "500 creators, 2,000 templates, 10,000+ downloads"

**Phase 2 - Monetization (Post-Investment)**
- Enable micro-pricing: 0-10 credits per template
- **Creator Incentive System**:
  - Authors earn credits when templates are purchased
  - Even 1 credit creates quality incentive
  - Paid items signal higher perceived value
  - Top creators build reputation and recurring income

**Credit Economy Benefits**:
- **Quality Self-Curation**: Creators polish templates before charging
- **Low Barrier**: 1 credit feels accessible to users
- **Virtuous Cycle**: Success motivates better content
- **Platform Investment**: Creators become invested in community success

**Feature Set**:
- Browse community templates
- Try before subscribing  
- Rate and review templates
- Featured creator templates
- Category organization
- Creator earnings dashboard
- Credit-based pricing system

## Social Sharing Integration

### Share Cards
- Generate rich embed cards
- Post directly to social platforms
- Links to `/play/[story-slug]`
- Open Graph meta tags
- Twitter/X card support
- Custom preview images
- Title/description customization

## Content Moderation

### Community-Driven
- Helpful users become natural moderators
- Feedback requirement reduces toxicity
- Voting system surfaces quality content
- Author feedback improves overall quality

## Benefits

### For Free Users
- Daily fresh content
- Bookmark favorite stories
- Read and experience stories
- Vote and participate
- Natural upgrade path when inspired to create

### For Creators
- Immediate audience for completed work
- Constructive feedback system
- Motivation to complete stories
- Recognition through trending
- Build following

### For Platform
- Viral marketing through shares
- User-generated content stream
- Free community moderation
- Natural conversion funnel
- High engagement metrics

## Technical Implementation

### Database Schema (Supabase)
- Users table (auth integration)
- Stories metadata (views, likes, completion)
- Comments/feedback
- Template listings
- Credit transactions
- Subscription states
- Following relationships
- Voting records

### Storage
- Story files (can migrate from filesystem)
- Media assets
- Template files
- User avatars
- Share card images

### Real-time Features
- Live vote counts
- New story notifications
- Follower updates
- Trending calculations

## Launch Strategy

### Phase 1: Core Community
- Basic feed with categories
- Simple voting system
- New stories section

### Phase 2: Gamification
- Helpful user competition
- Badges and achievements
- Leaderboards

### Phase 3: Marketplace
- Template sharing
- Preset system
- Premium templates

### Phase 4: Advanced Social
- Following system
- Direct messaging
- Collaboration features
- Community challenges

## Success Metrics
- Daily active users
- Stories completed per day
- Feedback quality scores
- Conversion rate (free to paid)
- Social shares
- Return visitor rate
- Community health score

## AI Story Interface Integration

### Story Fork Feature Enhancement
- **Story Fork Command**: `/story-fork [id] "new-name"` 
- **Generation DNA Storage**: Store original generation commands in story event attributes:
  ```json
  {
    "attributes": {
      "prompt": "quantum badger scientist",
      "template": "cinematic", 
      "enhanced": true,
      "generatedAt": "timestamp",
      "originalCommand": "story.generateMedia('quantum badger scientist', 'cinematic')"
    }
  }
  ```
- **Translation Matrix**: Convert published stories back to generative code for AI forking
- **Benefits**: 
  - AIs can read existing stories and create variations
  - Preserves creative process, not just final output
  - Enables collaborative AI-human story evolution
  - Creates "story DNA" for version control

---

*This living document will evolve as the community features are built and tested*