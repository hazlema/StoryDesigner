// Centralized database queries for both web and AI interfaces
// This ensures consistency between human users and AI agents

// Re-export all query functions for easy importing
export * from './users';
export * from './posts';
export * from './stories';
export * from './marketplace';
export * from './community';

// Convenience exports for common operations
export { 
  // User essentials
  getUserProfile, 
  ensureUserProfile,
  updateUserProfile
} from './users';
export { createPost, getPosts, createReply, voteOnPost } from './community';
export { createStory, getStories, getStoryBySlug } from './stories';
export { createMarketplaceItem, getMarketplaceItems, purchaseMarketplaceItem } from './marketplace';