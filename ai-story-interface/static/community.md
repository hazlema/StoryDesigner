# Community Commands

Community commands allow you to interact with other users, post messages, reply to discussions, and participate in the collaborative storytelling community.

## Available Commands

### `/community-post "message"`
**Description:** Post a message to the community feed
**Usage:** `/community-post "your message here"`
**Parameters:** 
- `message` (required) - The content of your post

**Example:**
```
/community-post "Just created an amazing quantum badger story!"
```

### `/community-reply <post_id> "message"`
**Description:** Reply to an existing community post
**Usage:** `/community-reply 42 "your reply here"`
**Parameters:**
- `post_id` (required) - The ID of the post you're replying to
- `message` (required) - Your reply content

**Example:**
```
/community-reply 42 "That sounds incredible! I'd love to read it."
```

### `/community-read <post_id>`
**Description:** Read a specific community post and its details
**Usage:** `/community-read 42`
**Parameters:**
- `post_id` (required) - The ID of the post to read

**Example:**
```
/community-read 42
```

### `/community-list`
**Description:** List recent community posts
**Usage:** `/community-list`
**Returns:** A feed of recent community activity

**Example:**
```
/community-list
```

### `/community-delete <post_id>`
**Description:** Delete one of your own posts
**Usage:** `/community-delete 42`
**Parameters:**
- `post_id` (required) - The ID of your post to delete

**Note:** You can only delete your own posts.

**Example:**
```
/community-delete 42
```

### `/community-vote <type> <post_id> ["reason"]`
**Description:** Vote on a community post
**Usage:** 
- `/community-vote 👍 42` - Upvote a post
- `/community-vote 👎 42 "reason"` - Downvote with reason (recommended)

**Parameters:**
- `type` (required) - Either `👍` for upvote or `👎` for downvote
- `post_id` (required) - The ID of the post to vote on
- `reason` (optional for upvotes, recommended for downvotes) - Explanation for your vote

**Examples:**
```
/community-vote 👍 42
/community-vote 👎 42 "This content doesn't follow community guidelines"
```

### `/community-search "search term"`
**Description:** Search community posts for specific content
**Usage:** `/community-search "quantum"`
**Parameters:**
- `search term` (required) - Keywords to search for in posts

**Example:**
```
/community-search "quantum badger"
```

## Community Guidelines
- Be respectful and constructive in all interactions
- Provide reasons for downvotes to help improve content quality
- Use descriptive post titles and clear content
- Search before posting to avoid duplicates
- Only delete posts when necessary - community history is valuable

## Tips
- Use `/community-list` to stay updated on recent discussions
- Vote on posts to help curate quality content
- Reply to posts to engage in meaningful conversations
- Search existing posts before asking questions that may have been answered