-- Test Database Schema with Sample Data
-- Run this AFTER setting up the main schema and creating some users via Supabase Auth

-- Sample test data (replace UUIDs with actual user IDs from auth.users)
-- You can get user IDs by running: SELECT id, email FROM auth.users;

-- Insert sample users (these should be created via Supabase Auth first)
-- Then update their profiles:
UPDATE public.users SET 
    username = 'storyteller123',
    bio = 'Love creating interactive stories!',
    reputation_score = 150,
    story_count = 3
WHERE email = 'user1@example.com';

UPDATE public.users SET 
    username = 'aiwriter',
    bio = 'AI enthusiast and story collaborator',
    reputation_score = 89,
    subscription_level = 'pro',
    subscribed = true
WHERE email = 'user2@example.com';

-- Sample posts
INSERT INTO public.posts (author_id, title, text, category, tags) VALUES
((SELECT id FROM public.users WHERE username = 'storyteller123'), 
 'Welcome to the StoryDesigner Community!', 
 'Hey everyone! Excited to be part of this amazing community. Looking forward to collaborating on some epic stories! 🚀', 
 'general', 
 ARRAY['welcome', 'introduction']),

((SELECT id FROM public.users WHERE username = 'aiwriter'), 
 'Best practices for AI story collaboration?', 
 'I''ve been experimenting with AI-assisted storytelling and wondered what techniques work best for you all. Any tips for maintaining narrative consistency?', 
 'discussion', 
 ARRAY['ai', 'tips', 'collaboration']),

((SELECT id FROM public.users WHERE username = 'storyteller123'), 
 'Check out my latest sci-fi adventure!', 
 'Just finished "The Quantum Badger Chronicles" - a wild ride through parallel dimensions. Would love feedback!', 
 'showcase', 
 ARRAY['sci-fi', 'showcase', 'feedback']);

-- Sample replies
INSERT INTO public.replies (parent_id, author_id, text) VALUES
((SELECT id FROM public.posts WHERE title LIKE 'Welcome to%'), 
 (SELECT id FROM public.users WHERE username = 'aiwriter'), 
 'Welcome! This community is fantastic for creative collaboration. You''ll love it here! 👋'),

((SELECT id FROM public.posts WHERE title LIKE 'Best practices%'), 
 (SELECT id FROM public.users WHERE username = 'storyteller123'), 
 'Great question! I find that setting clear character archetypes first helps maintain consistency. Also, regular story beats work well with AI.');

-- Sample marketplace items
INSERT INTO public.marketplace (author_id, name, description, category, price, tags, is_approved) VALUES
((SELECT id FROM public.users WHERE username = 'storyteller123'), 
 'Sci-Fi Adventure Template', 
 'Complete template for space exploration stories with branching paths and character development arcs.', 
 'template', 
 25, 
 ARRAY['sci-fi', 'adventure', 'template'], 
 true),

((SELECT id FROM public.users WHERE username = 'aiwriter'), 
 'AI Prompt Collection', 
 'Curated collection of effective prompts for AI-assisted storytelling.', 
 'tool', 
 15, 
 ARRAY['ai', 'prompts', 'tools'], 
 true);

-- Sample votes
INSERT INTO public.votes (user_id, target_type, target_id, vote_type) VALUES
((SELECT id FROM public.users WHERE username = 'aiwriter'), 
 'post', 
 (SELECT id FROM public.posts WHERE title LIKE 'Welcome to%'), 
 'upvote'),

((SELECT id FROM public.users WHERE username = 'storyteller123'), 
 'post', 
 (SELECT id FROM public.posts WHERE title LIKE 'Best practices%'), 
 'upvote');

-- Sample follows
INSERT INTO public.follows (follower_id, following_id) VALUES
((SELECT id FROM public.users WHERE username = 'aiwriter'), 
 (SELECT id FROM public.users WHERE username = 'storyteller123'));

-- Sample bookmarks
INSERT INTO public.bookmarks (user_id, post_id) VALUES
((SELECT id FROM public.users WHERE username = 'aiwriter'), 
 (SELECT id FROM public.posts WHERE title LIKE 'Check out my latest%'));

-- Sample stories
INSERT INTO public.stories (author_id, title, description, slug, tags, is_public, is_featured) VALUES
((SELECT id FROM public.users WHERE username = 'storyteller123'), 
 'The Quantum Badger Chronicles', 
 'A mind-bending adventure through parallel dimensions featuring an unlikely hero - a quantum-powered badger scientist!', 
 'the-quantum-badger-chronicles', 
 ARRAY['sci-fi', 'humor', 'adventure'], 
 true, 
 true),

((SELECT id FROM public.users WHERE username = 'aiwriter'), 
 'AI Dreams of Electric Stories', 
 'An experimental narrative exploring the relationship between artificial intelligence and creative storytelling.', 
 'ai-dreams-of-electric-stories', 
 ARRAY['ai', 'experimental', 'meta'], 
 true, 
 false);

-- Update post/reply counts and vote counts
UPDATE public.posts SET 
    upvotes = (SELECT COUNT(*) FROM public.votes WHERE target_type = 'post' AND target_id = posts.id AND vote_type = 'upvote'),
    downvotes = (SELECT COUNT(*) FROM public.votes WHERE target_type = 'post' AND target_id = posts.id AND vote_type = 'downvote');

UPDATE public.replies SET 
    upvotes = (SELECT COUNT(*) FROM public.votes WHERE target_type = 'reply' AND target_id = replies.id AND vote_type = 'upvote'),
    downvotes = (SELECT COUNT(*) FROM public.votes WHERE target_type = 'reply' AND target_id = replies.id AND vote_type = 'downvote');

-- Update user post/reply counts
UPDATE public.users SET 
    post_count = (SELECT COUNT(*) FROM public.posts WHERE author_id = users.id AND deleted_at IS NULL),
    reply_count = (SELECT COUNT(*) FROM public.replies WHERE author_id = users.id AND deleted_at IS NULL),
    story_count = (SELECT COUNT(*) FROM public.stories WHERE author_id = users.id);

-- Test queries to verify everything works
SELECT 'Database Test Results:' as status;

SELECT 'Users created:', COUNT(*) FROM public.users;
SELECT 'Posts created:', COUNT(*) FROM public.posts;
SELECT 'Replies created:', COUNT(*) FROM public.replies;
SELECT 'Marketplace items:', COUNT(*) FROM public.marketplace;
SELECT 'Votes cast:', COUNT(*) FROM public.votes;
SELECT 'Follows created:', COUNT(*) FROM public.follows;
SELECT 'Stories created:', COUNT(*) FROM public.stories;

-- Sample community feed query
SELECT 
    p.title,
    u.username,
    p.upvotes,
    p.created_at,
    p.category,
    ARRAY_TO_STRING(p.tags, ', ') as tags
FROM public.posts p
JOIN public.users u ON p.author_id = u.id
WHERE p.deleted_at IS NULL
ORDER BY p.created_at DESC
LIMIT 10;