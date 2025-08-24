-- StoryDesigner Community Database Schema
-- Supabase PostgreSQL Implementation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar TEXT, -- URL to avatar image
    email VARCHAR(255) UNIQUE NOT NULL,
    credits INTEGER DEFAULT 0,
    subscribed BOOLEAN DEFAULT false,
    subscription_level VARCHAR(20) DEFAULT 'free', -- 'free', 'pro', 'premium'
    subscription_date TIMESTAMPTZ,
    post_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    story_count INTEGER DEFAULT 0,
    last_login TIMESTAMPTZ DEFAULT NOW(),
    suspended BOOLEAN DEFAULT false,
    suspension_reason TEXT,
    reputation_score INTEGER DEFAULT 0,
    bio TEXT,
    location VARCHAR(100),
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table
CREATE TABLE public.posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255),
    text TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general', -- 'general', 'showcase', 'help', 'discussion'
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    downvote_reasons TEXT[], -- Array of reasons for downvotes
    views INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    tags TEXT[], -- Array of tags
    attributes JSONB DEFAULT '{}', -- Flexible metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Replies table
CREATE TABLE public.replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    downvote_reasons TEXT[], -- Array of reasons for downvotes
    views INTEGER DEFAULT 0,
    is_solution BOOLEAN DEFAULT false, -- Mark as solution to original post
    attributes JSONB DEFAULT '{}', -- Flexible metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Marketplace (Templates/Assets) table
CREATE TABLE public.marketplace (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail TEXT, -- URL to thumbnail image
    url TEXT, -- Download/access URL
    category VARCHAR(50) DEFAULT 'template', -- 'template', 'asset', 'tool'
    price INTEGER DEFAULT 0, -- Price in credits, 0 = free
    downloads INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.00, -- Average rating 0.00-5.00
    tags TEXT[], -- Array of tags
    is_featured BOOLEAN DEFAULT false,
    is_approved BOOLEAN DEFAULT false,
    attributes JSONB DEFAULT '{}', -- Flexible metadata (file size, requirements, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table (for posts and replies)
CREATE TABLE public.votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('post', 'reply')),
    target_id UUID NOT NULL,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    reason TEXT, -- Required for downvotes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id) -- One vote per user per item
);

-- Follows table (user following system)
CREATE TABLE public.follows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Bookmarks/Saved Posts
CREATE TABLE public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'reply', 'vote', 'follow', 'mention', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    action_url TEXT, -- URL to navigate to when clicked
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stories table (if you want to track community-shared stories)
CREATE TABLE public.stories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL,
    thumbnail TEXT, -- URL to thumbnail/cover image
    is_public BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    fork_count INTEGER DEFAULT 0,
    tags TEXT[], -- Array of tags
    attributes JSONB DEFAULT '{}', -- Story metadata, settings, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_posts_author_id ON public.posts(author_id);
CREATE INDEX idx_posts_category ON public.posts(category);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_posts_upvotes ON public.posts(upvotes DESC);

CREATE INDEX idx_replies_parent_id ON public.replies(parent_id);
CREATE INDEX idx_replies_author_id ON public.replies(author_id);
CREATE INDEX idx_replies_created_at ON public.replies(created_at);

CREATE INDEX idx_marketplace_author_id ON public.marketplace(author_id);
CREATE INDEX idx_marketplace_category ON public.marketplace(category);
CREATE INDEX idx_marketplace_rating ON public.marketplace(rating DESC);

CREATE INDEX idx_votes_target ON public.votes(target_type, target_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, is_read, created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (you'll want to customize these)

-- Users can read all public user profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.users
    FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Posts are viewable by everyone
CREATE POLICY "Posts are viewable by everyone" ON public.posts
    FOR SELECT USING (deleted_at IS NULL);

-- Users can create posts
CREATE POLICY "Users can create posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = author_id);

-- Replies are viewable by everyone
CREATE POLICY "Replies are viewable by everyone" ON public.replies
    FOR SELECT USING (deleted_at IS NULL);

-- Users can create replies
CREATE POLICY "Users can create replies" ON public.replies
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own replies
CREATE POLICY "Users can update own replies" ON public.replies
    FOR UPDATE USING (auth.uid() = author_id);

-- Marketplace items are viewable by everyone
CREATE POLICY "Marketplace items are viewable by everyone" ON public.marketplace
    FOR SELECT USING (is_approved = true);

-- Users can create marketplace items
CREATE POLICY "Users can create marketplace items" ON public.marketplace
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Users can update their own marketplace items
CREATE POLICY "Users can update own marketplace items" ON public.marketplace
    FOR UPDATE USING (auth.uid() = author_id);

-- Users can manage their own votes
CREATE POLICY "Users can manage own votes" ON public.votes
    FOR ALL USING (auth.uid() = user_id);

-- Users can manage their own follows
CREATE POLICY "Users can manage own follows" ON public.follows
    FOR ALL USING (auth.uid() = follower_id);

-- Users can manage their own bookmarks
CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own notifications
CREATE POLICY "Users can only see own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- Stories policies (customize based on your needs)
CREATE POLICY "Public stories are viewable by everyone" ON public.stories
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create stories" ON public.stories
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update own stories" ON public.stories
    FOR UPDATE USING (auth.uid() = author_id);