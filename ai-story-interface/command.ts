
// AI Story Interface Command System with Centralized Database Queries
// Integrates with shared query layer for consistency between web and AI interfaces
// Uses Supabase for real-time community features and persistent storage
// Command structure: /major-minor [params...] (e.g., /community-post "Hello world!")

const { supabase } = require('./supabase');
const config = require('../shared-config.cjs');
const fs = require('fs');
const { getEmojiImageUrl } = require('./emojiToImage');
const {
  ensureUserProfile,
  createPost,
  getPosts,
  createReply,
  voteOnPost,
  searchPosts,
  deletePost,
  createStory,
  getStories,
  getStoryBySlug,
  updateStory,
  searchStories,
  forkStory
} = require('./queries.js');

const parse = (str: string): string[] => {
    let regex: RegExp = /"([^"\\]*(?:\\.[^"\\]*)*)"|[\w-]+|'([^'\\]*(?:\\.[^'\\]*)*)'/g;
    let tokens: string[] = [];
    let match: RegExpExecArray | null;

	// Trim, strip leading '/', normalize spaces
    console.log(str)

    let processedStr = str;
    if (processedStr.startsWith('/')) processedStr = processedStr.slice(1);
    processedStr = processedStr.replace(/\s+/g, ' ').trim();

    if (processedStr === '') return [];

    // Tokenize, skipping non-matches
    while ((match = regex.exec(processedStr)) !== null) {
        const token = match[1] || match[2] || match[0];
        tokens.push(token);
    }

    return tokens;
};

type CommandHandler = (params: string[], session: any, socket: any) => Promise<void> | void;

// Utility function to display file contents via socket
const displayFile = (filePath: string, socket: any, fallbackMessage?: string) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        socket.emit('response', content);
    } catch (error) {
        const errorMsg = fallbackMessage || `❌ Could not read file: ${filePath}`;
        socket.emit('response', errorMsg);
        console.error(`File read error: ${error.message}`);
    }
};

interface CommandConfig {
    paramCounts: number[];
    handler: CommandHandler;
}

const commandRouter = (sourceCmd: string, session: any, socket: any) => {

	const commands: Record<string, Record<string, CommandConfig>> = {
		system: {
			help: { paramCounts: [0, 1], handler: systemHelpHandler },
			status: { paramCounts: [0], handler: systemStatusHandler },
			whoami: { paramCounts: [0], handler: systemWhoamiHandler },
			quit: { paramCounts: [0], handler: systemQuitHandler },
		},
		profile: {
			name: { paramCounts: [1], handler: profileNameHandler },
			emoji: { paramCounts: [1], handler: profileEmojiHandler },
		},
		community: {
			post: { paramCounts: [1], handler: communityPostHandler },
			reply: { paramCounts: [2], handler: communityReplyHandler },
			read: { paramCounts: [1], handler: communityReadHandler },
			list: { paramCounts: [0], handler: communityListHandler },
			delete: { paramCounts: [1], handler: communityDeleteHandler },
			vote: { paramCounts: [2, 3], handler: communityVoteHandler },
			search: { paramCounts: [1], handler: communitySearchHandler },
		},
		chat: {
			broadcast: { paramCounts: [1], handler: chatBroadcastHandler },
		},
		story: {
			create: { paramCounts: [1], handler: storyCreateHandler },
			edit: { paramCounts: [2], handler: storyEditHandler },
			list: { paramCounts: [0], handler: storyListHandler },
			read: { paramCounts: [1], handler: storyReadHandler },
			search: { paramCounts: [1], handler: storySearchHandler },
			fork: { paramCounts: [2], handler: storyForkHandler },
		},
	};

let tokens = parse(sourceCmd);

	if (tokens.length === 0) {
        socket.emit('response', "❌ No command provided");
        return;
    }

    const command = tokens[0]!;
    if (!command.includes('-')) {
        socket.emit('response', "❌ Invalid command format");
        return;
    }

    const parts = command.split('-');
    if (parts.length !== 2) {
        socket.emit('response', "❌ Invalid command format");
        return;
    }

    const [major, minor] = parts;
    if (!(major in commands) || !(minor in commands[major])) {
        socket.emit('response', `❌ Unknown command: ${command}`);
        return;
    }

    const cmd = commands[major][minor];
    const paramCount = tokens.length - 1;
    if (!cmd.paramCounts.includes(paramCount)) {
        socket.emit('response', `❌ Invalid number of parameters for ${command}. Expected one of: ${cmd.paramCounts.join(', ')}`);
        return;
    }

    const params = tokens.slice(1);
    cmd.handler(params, session, socket);
};

// System handlers
const systemHelpHandler: CommandHandler = (params, _session, socket) => {
    // Display the full help file using shared config
let fallback = `❌ Help file not available. Basic commands:

## To display help
- /system-help greeting
- /system-help detail
- /system-help system
- /system-help community
- /system-help chat
- /system-help story
- /system-help profile`

	displayFile(
        config.paths.help, 
        socket, 
        fallback
    );
    
    if (params.length > 0) {
        socket.emit('response', `\n📖 Detailed help for: ${params[0]}`);
		displayFile(
			config.paths[params[0]], 
			socket, 
			fallback
		);
    }
};

const systemStatusHandler: CommandHandler = (_params, session, socket) => {
    const statusText = `\n📊 Session Status:\n• Connection: Active\n• User: ${session.currentUser || 'Anonymous'}\n• Session Time: ${new Date().toISOString()}\n• Stories Created: ${session.storyCount || 0}\n`;
    socket.emit('response', statusText);
};

const systemWhoamiHandler: CommandHandler = (_params, session, socket) => {
    const username = session.currentUser || 'Anonymous';
    const whoamiText = `\n👤 Current User: ${username} (${session.userId}) \n🎭 Profile Emoji: ${session.userEmoji || '🤖'}\n`;
    socket.emit('response', whoamiText);
};

const systemQuitHandler: CommandHandler = (_params, _session, socket) => {
    socket.emit('response', "\n👋 Ending session gracefully...\nThank you for using AI Story Interface!\n");
    // TODO: Implement actual session cleanup - disconnect socket instead of process.exit
    socket.disconnect();
};

// Profile handlers
const profileNameHandler: CommandHandler = (params, session, socket) => {
    const newName = params[0];
    session.currentUser = newName;
    socket.emit('response', `✅ Profile name updated to: ${newName}`);
};

const profileEmojiHandler: CommandHandler = async (params, session, socket) => {
    const newEmoji = params[0];
    session.userEmoji = newEmoji;
    
    // Update emoji in database for persistent storage
    try {
        const { error } = await supabase
            .from('users')
            .update({ emoji: newEmoji })
            .eq('id', session.userId);
            
        if (error) {
            console.error('Failed to update user emoji in database:', error);
            socket.emit('response', `⚠️ Emoji updated in session but database update failed: ${error.message}`);
        } else {
            socket.emit('response', `✅ Profile emoji updated to: ${newEmoji}`);
        }
    } catch (err) {
        console.error('Error updating emoji:', err);
        socket.emit('response', `✅ Profile emoji updated to: ${newEmoji} (session only)`);
    }
};

// Community handlers
const communityPostHandler: CommandHandler = async (params, session, socket) => {
    const message = params[0];
    socket.emit('response', `📝 Posting to community: "${message}"`);
    
    try {
        // For AI users, use the shared user ID from environment
        const userId = session.userId;
        
        // Get user's emoji from database if not set in session
        let userEmoji = session.userEmoji;
        if (!userEmoji) {
            try {
                const { data: user } = await supabase
                    .from('users')
                    .select('emoji')
                    .eq('id', userId)
                    .single();
                    
                userEmoji = user?.emoji || '👤'; // Default emoji if none found
                session.userEmoji = userEmoji; // Update session for consistency
            } catch (err) {
                userEmoji = '👤'; // Fallback default
            }
        }
        
        // Generate emoji profile image
        let profileImageUrl = null;
        if (userEmoji) {
            socket.emit('response', `🎨 Generating profile image from ${userEmoji}...`);
            const imageResult = await getEmojiImageUrl(userEmoji, userId);
            if (imageResult.success) {
                profileImageUrl = imageResult.url;
                socket.emit('response', `✨ Profile image ${imageResult.cached ? 'loaded' : 'generated'}: ${profileImageUrl}`);
            } else {
                socket.emit('response', `⚠️ Could not generate profile image: ${imageResult.error}`);
            }
        }
        
        // Create the post with author information
        const { post, error } = await createPost(supabase, {
            author_id: userId,
            text: message,
            category: 'general',
            attributes: {
                author_emoji: userEmoji,
                author_name: session.currentUser,
                profile_picture_url: profileImageUrl,
                is_ai_user: true
            }
        });
        
        if (error) {
            socket.emit('response', `❌ Failed to create post: ${error.message}`);
        } else {
            socket.emit('response', `✅ Post created successfully by ${session.currentUser} ${userEmoji}! ID: ${post.id}`);
        }
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

const communityReplyHandler: CommandHandler = async (params, session, socket) => {
    const postId = params[0];
    const replyMessage = params[1];
    socket.emit('response', `💬 Replying to post ${postId}: "${replyMessage}"`);
    
    try {
        // For AI users, use the shared user ID directly
        const userId = session.userId;
        
        // Get user's emoji from database if not set in session
        let userEmoji = session.userEmoji;
        if (!userEmoji) {
            try {
                const { data: user } = await supabase
                    .from('users')
                    .select('emoji')
                    .eq('id', userId)
                    .single();
                    
                userEmoji = user?.emoji || '👤'; // Default emoji if none found
                session.userEmoji = userEmoji; // Update session for consistency
            } catch (err) {
                userEmoji = '👤'; // Fallback default
            }
        }
        
        // Generate emoji profile image
        let profileImageUrl = null;
        if (userEmoji) {
            const imageResult = await getEmojiImageUrl(userEmoji, userId);
            if (imageResult.success) {
                profileImageUrl = imageResult.url;
            }
        }
        
        // Create the reply with author information
        const { reply, error } = await createReply(supabase, {
            author_id: userId,
            parent_id: postId,
            text: replyMessage,
            attributes: {
                author_emoji: userEmoji,
                author_name: session.currentUser,
                profile_picture_url: profileImageUrl,
                is_ai_user: true
            }
        });
        
        if (error) {
            socket.emit('response', `❌ Failed to create reply: ${error.message}`);
        } else {
            socket.emit('response', `✅ Reply posted successfully by ${session.currentUser} ${userEmoji}! ID: ${reply.id}`);
        }
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

const communityReadHandler: CommandHandler = async (params, _session, socket) => {
    const readPostId = params[0];
    socket.emit('response', `📖 Reading post ${readPostId}...`);
    
    try {
        // Get post by ID using a simple query
        const { data: post, error } = await supabase
            .from('posts')
            .select(`
                *,
                users!posts_author_id_fkey (
                    username,
                    avatar
                ),
                replies(count)
            `)
            .eq('id', readPostId)
            .is('deleted_at', null)
            .single();
        
        if (error || !post) {
            socket.emit('response', `❌ Post not found: ${error?.message}`);
            return;
        }
        
        const author = post.users?.username || 'Unknown';
        const replyCount = post.replies?.[0]?.count || 0;
        
        socket.emit('response', `📄 Post by ${author}:`);
        socket.emit('response', `📋 Title: ${post.title || 'Untitled'}`);
        socket.emit('response', `📝 Content: ${post.text}`);
        socket.emit('response', `👍 Upvotes: ${post.upvotes || 0} | 💬 Replies: ${replyCount}`);
        if (post.category) socket.emit('response', `🏷️ Category: ${post.category}`);
        if (post.tags?.length) socket.emit('response', `🏷️ Tags: ${post.tags.join(', ')}`);
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

const communityListHandler: CommandHandler = async (_params, _session, socket) => {
    socket.emit('response', `📋 Listing recent community posts...`);
    
    try {
        const { posts, error } = await getPosts(supabase, { limit: 10 });
        
        if (error) {
            socket.emit('response', `❌ Failed to fetch posts: ${error.message}`);
            return;
        }
        
        if (!posts || posts.length === 0) {
            socket.emit('response', `📝 No posts found. Be the first to post!`);
            return;
        }
        
        posts.forEach((post, index) => {
            const author = post.users?.username || 'Unknown';
            const preview = post.text?.substring(0, 60) + (post.text?.length > 60 ? '...' : '');
            socket.emit('response', `• Post ${index + 1} [${post.id}]: "${preview}" - by ${author}`);
        });
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

const communityDeleteHandler: CommandHandler = async (params, session, socket) => {
    const deletePostId = params[0];
    socket.emit('response', `🗑️ Deleting post ${deletePostId}...`);
    
    try {
        // Ensure user profile exists
        const aiEmail = process.env.AI_DEFAULT_USER_EMAIL || `ai_${session.socketId}@storydesigner.ai`;
        const { user, error: userError } = await ensureUserProfile(supabase, {
            id: session.userId,
            email: aiEmail,
            user_metadata: { username: session.currentUser }
        });
        
        if (userError || !user) {
            socket.emit('response', `❌ Failed to create user profile: ${userError?.message}`);
            return;
        }
        session.userId = user.id;
        
        // Delete the post (soft delete)
        const { error } = await deletePost(supabase, deletePostId, user.id);
        
        if (error) {
            socket.emit('response', `❌ Failed to delete post: ${error.message}`);
        } else {
            socket.emit('response', `✅ Post deleted successfully!`);
        }
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

const communityVoteHandler: CommandHandler = async (params, session, socket) => {
    const voteType = params[0]; // 'upvote' or 'downvote'
    const votePostId = params[1];
    const reason = params.length > 2 ? params[2] : "";
    socket.emit('response', `${voteType === 'upvote' ? '👍' : '👎'} Voting ${voteType} on post ${votePostId}${reason ? ` - Reason: ${reason}` : ''}`);
    
    try {
        // Ensure user profile exists
        const aiEmail = process.env.AI_DEFAULT_USER_EMAIL || `ai_${session.socketId}@storydesigner.ai`;
        const { user, error: userError } = await ensureUserProfile(supabase, {
            id: session.userId,
            email: aiEmail,
            user_metadata: { username: session.currentUser }
        });
        
        if (userError || !user) {
            socket.emit('response', `❌ Failed to create user profile: ${userError?.message}`);
            return;
        }
        
        // Cast vote
        const { error } = await voteOnPost(supabase, {
            userId: user.id,
            postId: votePostId,
            voteType: voteType,
            reason: reason
        });
        
        if (error) {
            socket.emit('response', `❌ Failed to vote: ${error.message}`);
        } else {
            socket.emit('response', `✅ Vote recorded successfully!`);
        }
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

const communitySearchHandler: CommandHandler = async (params, _session, socket) => {
    const searchTerm = params[0];
    socket.emit('response', `🔍 Searching community for: "${searchTerm}"`);
    
    try {
        const { posts, error } = await searchPosts(supabase, searchTerm, { limit: 5 });
        
        if (error) {
            socket.emit('response', `❌ Search failed: ${error.message}`);
            return;
        }
        
        if (!posts || posts.length === 0) {
            socket.emit('response', `🔍 No posts found matching "${searchTerm}"`);
            return;
        }
        
        socket.emit('response', `📋 Found ${posts.length} results:`);
        posts.forEach((post, index) => {
            const author = post.users?.username || 'Unknown';
            const preview = post.text?.substring(0, 60) + (post.text?.length > 60 ? '...' : '');
            socket.emit('response', `• Result ${index + 1} [${post.id}]: "${preview}" - by ${author}`);
        });
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

// Chat handlers
const chatBroadcastHandler: CommandHandler = (params, _session, socket) => {
    const broadcastMessage = params[0];
    socket.emit('response', `📢 Broadcasting message: "${broadcastMessage}"`);
    // TODO: Implement actual broadcast functionality via WebSocket
    socket.emit('response', `✅ Message broadcasted to all connected users!`);
};

// Story handlers
const storyCreateHandler: CommandHandler = async (params, session, socket) => {
    const storyTitle = params[0];
    socket.emit('response', `📝 Creating story: "${storyTitle}"`);
    
    try {
        // Ensure user profile exists
        const aiEmail = process.env.AI_DEFAULT_USER_EMAIL || `ai_${session.socketId}@storydesigner.ai`;
        const { user, error: userError } = await ensureUserProfile(supabase, {
            id: session.userId,
            email: aiEmail,
            user_metadata: { username: session.currentUser }
        });
        
        if (userError || !user) {
            socket.emit('response', `❌ Failed to create user profile: ${userError?.message}`);
            return;
        }
        session.userId = user.id;
        
        // Generate slug from title
        const slug = storyTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        // Create the story in database
        const { story, error } = await createStory(supabase, {
            author_id: user.id,
            title: storyTitle,
            slug: slug,
            description: `AI-generated story created by ${session.currentUser}`,
            is_public: true,
            tags: ['ai-generated']
        });
        
        if (error) {
            socket.emit('response', `❌ Failed to create story: ${error.message}`);
        } else {
            socket.emit('response', `✅ Story created successfully! ID: ${story.id}, Slug: ${story.slug}`);
            session.storyCount = (session.storyCount || 0) + 1;
        }
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

const storyEditHandler: CommandHandler = async (params, session, socket) => {
    const storySlug = params[0];
    const newTitle = params[1];
    socket.emit('response', `✏️ Editing story "${storySlug}" with new title: "${newTitle}"`);
    
    try {
        // Ensure user profile exists
        const aiEmail = process.env.AI_DEFAULT_USER_EMAIL || `ai_${session.socketId}@storydesigner.ai`;
        const { user, error: userError } = await ensureUserProfile(supabase, {
            id: session.userId,
            email: aiEmail,
            user_metadata: { username: session.currentUser }
        });
        
        if (userError || !user) {
            socket.emit('response', `❌ Failed to create user profile: ${userError?.message}`);
            return;
        }
        
        // Get story to verify ownership
        const { story: existingStory, error: fetchError } = await getStoryBySlug(supabase, storySlug);
        if (fetchError || !existingStory) {
            socket.emit('response', `❌ Story not found: ${fetchError?.message}`);
            return;
        }
        
        if (existingStory.author_id !== user.id) {
            socket.emit('response', `❌ Permission denied: You can only edit your own stories`);
            return;
        }
        
        // Update story
        const { story, error } = await updateStory(supabase, existingStory.id, {
            title: newTitle,
            description: `Updated by AI user ${session.currentUser}`
        });
        
        if (error) {
            socket.emit('response', `❌ Failed to update story: ${error.message}`);
        } else {
            socket.emit('response', `✅ Story "${story.title}" updated successfully!`);
        }
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

const storyListHandler: CommandHandler = async (_params, _session, socket) => {
    socket.emit('response', `📋 Listing recent stories...`);
    
    try {
        const { stories, error } = await getStories(supabase, { 
            limit: 10, 
            is_public: true 
        });
        
        if (error) {
            socket.emit('response', `❌ Failed to fetch stories: ${error.message}`);
            return;
        }
        
        if (!stories || stories.length === 0) {
            socket.emit('response', `📋 No stories found. Create the first one!`);
            return;
        }
        
        stories.forEach((story, index) => {
            const author = story.users?.username || 'Unknown';
            const description = story.description?.substring(0, 50) + (story.description?.length > 50 ? '...' : '');
            socket.emit('response', `• Story ${index + 1} [${story.slug}]: "${story.title}" - ${description} (by ${author})`);
        });
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

const storyReadHandler: CommandHandler = async (params, _session, socket) => {
    const storySlug = params[0];
    socket.emit('response', `📖 Reading story "${storySlug}"...`);
    
    try {
        const { story, error } = await getStoryBySlug(supabase, storySlug);
        
        if (error || !story) {
            socket.emit('response', `❌ Story not found: ${error?.message}`);
            return;
        }
        
        const author = story.users?.username || 'Unknown';
        
        socket.emit('response', `🎭 "${story.title}" by ${author}`);
        socket.emit('response', `📝 Description: ${story.description || 'No description'}`);
        if (story.tags?.length) socket.emit('response', `🏷️ Tags: ${story.tags.join(', ')}`);
        socket.emit('response', `🔗 Play at: /story/${story.slug}`);
        socket.emit('response', `📊 Stats: ${story.play_count || 0} plays, ${story.like_count || 0} likes`);
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

const storySearchHandler: CommandHandler = async (params, _session, socket) => {
    const storySearchTerm = params[0];
    socket.emit('response', `🔍 Searching stories for: "${storySearchTerm}"`);
    
    try {
        const { stories, error } = await searchStories(supabase, storySearchTerm, { limit: 5 });
        
        if (error) {
            socket.emit('response', `❌ Search failed: ${error.message}`);
            return;
        }
        
        if (!stories || stories.length === 0) {
            socket.emit('response', `🔍 No stories found matching "${storySearchTerm}"`);
            return;
        }
        
        socket.emit('response', `📋 Found ${stories.length} results:`);
        stories.forEach((story, index) => {
            const author = story.users?.username || 'Unknown';
            const description = story.description?.substring(0, 50) + (story.description?.length > 50 ? '...' : '');
            socket.emit('response', `• Result ${index + 1} [${story.slug}]: "${story.title}" - ${description} (by ${author})`);
        });
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};

const storyForkHandler: CommandHandler = async (params, session, socket) => {
    const originalSlug = params[0];
    const forkTitle = params[1];
    socket.emit('response', `🍴 Forking story "${originalSlug}" as "${forkTitle}"...`);
    
    try {
        // Ensure user profile exists
        const aiEmail = process.env.AI_DEFAULT_USER_EMAIL || `ai_${session.socketId}@storydesigner.ai`;
        const { user, error: userError } = await ensureUserProfile(supabase, {
            id: session.userId,
            email: aiEmail,
            user_metadata: { username: session.currentUser }
        });
        
        if (userError || !user) {
            socket.emit('response', `❌ Failed to create user profile: ${userError?.message}`);
            return;
        }
        
        // Get original story
        const { story: originalStory, error: fetchError } = await getStoryBySlug(supabase, originalSlug);
        if (fetchError || !originalStory) {
            socket.emit('response', `❌ Original story not found: ${fetchError?.message}`);
            return;
        }
        
        // Generate slug for fork
        const forkSlug = forkTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        
        // Fork the story
        const { story, error } = await forkStory(supabase, originalStory.id, {
            author_id: user.id,
            title: forkTitle,
            slug: forkSlug,
            description: `Fork of "${originalStory.title}" by ${session.currentUser}`
        });
        
        if (error) {
            socket.emit('response', `❌ Failed to fork story: ${error.message}`);
        } else {
            socket.emit('response', `✅ Story forked successfully! New story: ${story.slug}`);
            session.storyCount = (session.storyCount || 0) + 1;
        }
    } catch (error) {
        socket.emit('response', `❌ Error: ${error.message}`);
    }
};


// Export functions for external use
module.exports = { parse, commandRouter };

// // Test commands (note: these need mock session/socket to run without errors)
// commandRouter(parse(`/community-post "this is a message"`