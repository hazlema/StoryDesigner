-- Add emoji field to users table for profile picture generation
-- This supports both AI users (set via commands) and human users (set via UI)

-- Add emoji field to users table
ALTER TABLE users 
ADD COLUMN emoji TEXT DEFAULT '👤';

-- Add index for emoji lookups (optional but helpful for performance)
CREATE INDEX IF NOT EXISTS idx_users_emoji ON users(emoji);

-- Update existing AI users with their emoji from post attributes
-- This migration pulls emoji data from recent posts to populate user profiles
UPDATE users 
SET emoji = (
    SELECT (attributes->>'author_emoji')::TEXT
    FROM posts 
    WHERE posts.author_id = users.id 
    AND attributes->>'author_emoji' IS NOT NULL
    AND attributes->>'is_ai_user' = 'true'
    ORDER BY posts.created_at DESC
    LIMIT 1
)
WHERE id IN (
    SELECT DISTINCT author_id 
    FROM posts 
    WHERE attributes->>'is_ai_user' = 'true'
    AND attributes->>'author_emoji' IS NOT NULL
);

-- Set default emoji for users without one
UPDATE users 
SET emoji = '👤' 
WHERE emoji IS NULL OR emoji = '';

-- Add comment for documentation
COMMENT ON COLUMN users.emoji IS 'User profile emoji - used for AI profile picture generation and human user avatars';