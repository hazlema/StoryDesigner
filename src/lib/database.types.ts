// Database types for Supabase
// You can generate these automatically with: npx supabase gen types typescript --project-id your-project-ref

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          avatar: string | null
          email: string
          credits: number
          subscribed: boolean
          subscription_level: string
          subscription_date: string | null
          post_count: number
          reply_count: number
          story_count: number
          last_login: string
          suspended: boolean
          suspension_reason: string | null
          reputation_score: number
          bio: string | null
          location: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          avatar?: string | null
          credits?: number
          subscribed?: boolean
          subscription_level?: string
          subscription_date?: string | null
          post_count?: number
          reply_count?: number
          story_count?: number
          last_login?: string
          suspended?: boolean
          suspension_reason?: string | null
          reputation_score?: number
          bio?: string | null
          location?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar?: string | null
          email?: string
          credits?: number
          subscribed?: boolean
          subscription_level?: string
          subscription_date?: string | null
          post_count?: number
          reply_count?: number
          story_count?: number
          last_login?: string
          suspended?: boolean
          suspension_reason?: string | null
          reputation_score?: number
          bio?: string | null
          location?: string | null
          website?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          title: string | null
          text: string
          category: string
          upvotes: number
          downvotes: number
          downvote_reasons: string[] | null
          views: number
          is_pinned: boolean
          is_locked: boolean
          tags: string[] | null
          attributes: any
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          author_id: string
          title?: string | null
          text: string
          category?: string
          upvotes?: number
          downvotes?: number
          downvote_reasons?: string[] | null
          views?: number
          is_pinned?: boolean
          is_locked?: boolean
          tags?: string[] | null
          attributes?: any
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          author_id?: string
          title?: string | null
          text?: string
          category?: string
          upvotes?: number
          downvotes?: number
          downvote_reasons?: string[] | null
          views?: number
          is_pinned?: boolean
          is_locked?: boolean
          tags?: string[] | null
          attributes?: any
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      // Add other tables as needed...
    }
  }
}