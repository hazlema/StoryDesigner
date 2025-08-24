# Supabase Setup Guide for StoryDesigner

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a project name: `storydesigner-community`
3. Set a secure database password
4. Choose your preferred region

## 2. Database Schema Setup

1. In your Supabase dashboard, go to the **SQL Editor**
2. Create a new query and paste the contents of `database-schema.sql`
3. Run the query to create all tables, indexes, and policies

## 3. Environment Variables

Add these to your `.env.local` file:

```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 4. Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-sveltekit
```

## 5. Authentication Setup

### Enable Auth Providers
In Supabase Dashboard > Authentication > Settings:
- Enable Email/Password
- Configure any social providers (Google, GitHub, etc.)
- Set Site URL to your development URL (e.g., `http://localhost:5173`)

### Auth Configuration
The schema includes a `users` table that extends Supabase's built-in `auth.users` table with additional community-specific fields.

## 6. Key Features Included

### Core Tables
- **users**: Extended user profiles with community features
- **posts**: Community discussions with voting and categorization
- **replies**: Threaded replies to posts
- **marketplace**: Template/asset sharing system
- **votes**: Voting system for posts and replies
- **follows**: User following system
- **bookmarks**: Save posts for later
- **notifications**: In-app notification system
- **stories**: Community-shared stories

### Advanced Features
- **Row Level Security (RLS)**: All tables protected with appropriate policies
- **JSONB attributes**: Flexible metadata storage for extensibility
- **Array fields**: Tags, downvote reasons, etc.
- **Soft deletes**: Posts/replies marked as deleted instead of hard deletion
- **Performance indexes**: Optimized queries for common operations

### Authentication Integration
- Uses Supabase Auth with custom user profiles
- RLS policies ensure users can only access/modify their own data
- Support for subscription levels and credit systems

## 7. Testing the Setup

Once you've run the schema, you can test it by:
1. Creating a user account through your app
2. Inserting test data using the Supabase dashboard
3. Verifying RLS policies work correctly

## 8. Next Steps

1. Set up Supabase client in your SvelteKit app
2. Create database service functions
3. Implement authentication flows
4. Build community features UI
5. Add real-time subscriptions for live updates

## Sample Data Queries

```sql
-- Test user creation (after auth signup)
INSERT INTO public.users (id, username, email) 
VALUES ('user-uuid-here', 'testuser', 'test@example.com');

-- Test post creation
INSERT INTO public.posts (author_id, title, text, category) 
VALUES ('user-uuid-here', 'Welcome Post', 'Hello community!', 'general');

-- Test marketplace item
INSERT INTO public.marketplace (author_id, name, description, category, price)
VALUES ('user-uuid-here', 'Sci-Fi Template', 'A futuristic story template', 'template', 10);
```