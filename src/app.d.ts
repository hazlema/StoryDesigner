// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import { SupabaseClient, Session } from '@supabase/supabase-js'
import type { Database } from '$lib/database.types'

declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient<Database>
			getSession(): Promise<Session | null>
			user: Session['user'] | null
		}
		interface PageData {
			session: Session | null
			user: Session['user'] | null
		}
		// interface Error {}
		// interface Platform {}
	}
}

export {};
