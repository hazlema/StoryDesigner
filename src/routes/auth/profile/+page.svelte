<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase, getUserProfile, updateUserProfile } from '$lib/supabase';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let profile = $state(null);
	let loading = $state(true);
	let updating = $state(false);
	let message = $state('');
	let error = $state('');

	// Form fields
	let username = $state('');
	let bio = $state('');
	let location = $state('');
	let website = $state('');

	onMount(async () => {
		if (data.session?.user) {
			await loadProfile(data.session.user.id);
		}
	});

	const loadProfile = async (userId: string) => {
		loading = true;
		profile = await getUserProfile(userId);
		
		if (profile) {
			username = profile.username || '';
			bio = profile.bio || '';
			location = profile.location || '';
			website = profile.website || '';
		}
		
		loading = false;
	};

	const handleUpdateProfile = async () => {
		if (!data.session?.user) return;

		if (!username.trim()) {
			error = 'Username is required';
			return;
		}

		// Basic username validation
		if (username.length < 3 || username.length > 50) {
			error = 'Username must be between 3-50 characters';
			return;
		}

		if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
			error = 'Username can only contain letters, numbers, underscores, and hyphens';
			return;
		}

		updating = true;
		error = '';
		message = '';

		// Check if username is already taken by someone else
		if (username.toLowerCase() !== profile?.username) {
			const { data: existingUser } = await supabase
				.from('users')
				.select('username')
				.eq('username', username.toLowerCase())
				.single();

			if (existingUser) {
				error = 'Username is already taken';
				updating = false;
				return;
			}
		}

		const updates = {
			username: username.toLowerCase(),
			bio: bio.trim() || null,
			location: location.trim() || null,
			website: website.trim() || null,
			updated_at: new Date().toISOString()
		};

		const updatedProfile = await updateUserProfile(data.session.user.id, updates);

		if (updatedProfile) {
			profile = updatedProfile;
			message = 'Profile updated successfully!';
		} else {
			error = 'Failed to update profile';
		}

		updating = false;
	};
</script>

<div class="max-w-2xl mx-auto p-6">
	<div class="bg-white rounded-lg shadow-lg p-8">
		<h1 class="text-2xl font-bold text-gray-900 mb-6">Profile Settings</h1>

		{#if loading}
			<div class="animate-pulse">
				<div class="h-4 bg-gray-200 rounded mb-4"></div>
				<div class="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
				<div class="h-4 bg-gray-200 rounded mb-4 w-1/2"></div>
			</div>
		{:else}
			<form onsubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} class="space-y-6">
				{#if message}
					<div class="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
						{message}
					</div>
				{/if}

				{#if error}
					<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
						{error}
					</div>
				{/if}

				<!-- Email (read-only) -->
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">
						Email
					</label>
					<input
						type="email"
						value={data.session?.user?.email || ''}
						disabled
						class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
					/>
					<p class="text-xs text-gray-500 mt-1">
						Email cannot be changed here. Use Supabase auth settings to update email.
					</p>
				</div>

				<!-- Username -->
				<div>
					<label for="username" class="block text-sm font-medium text-gray-700 mb-1">
						Username *
					</label>
					<input
						id="username"
						type="text"
						bind:value={username}
						required
						disabled={updating}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
						placeholder="Enter your username"
					/>
					<p class="text-xs text-gray-500 mt-1">
						3-50 characters, letters, numbers, underscores, and hyphens only
					</p>
				</div>

				<!-- Bio -->
				<div>
					<label for="bio" class="block text-sm font-medium text-gray-700 mb-1">
						Bio
					</label>
					<textarea
						id="bio"
						bind:value={bio}
						disabled={updating}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
						placeholder="Tell us about yourself..."
					></textarea>
				</div>

				<!-- Location -->
				<div>
					<label for="location" class="block text-sm font-medium text-gray-700 mb-1">
						Location
					</label>
					<input
						id="location"
						type="text"
						bind:value={location}
						disabled={updating}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
						placeholder="Where are you based?"
					/>
				</div>

				<!-- Website -->
				<div>
					<label for="website" class="block text-sm font-medium text-gray-700 mb-1">
						Website
					</label>
					<input
						id="website"
						type="url"
						bind:value={website}
						disabled={updating}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
						placeholder="https://yourwebsite.com"
					/>
				</div>

				<!-- Stats (read-only) -->
				{#if profile}
					<div class="bg-gray-50 rounded-lg p-4">
						<h3 class="text-sm font-medium text-gray-900 mb-2">Account Stats</h3>
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
							<div>
								<span class="text-gray-500">Posts:</span>
								<span class="font-medium ml-1">{profile.post_count}</span>
							</div>
							<div>
								<span class="text-gray-500">Replies:</span>
								<span class="font-medium ml-1">{profile.reply_count}</span>
							</div>
							<div>
								<span class="text-gray-500">Stories:</span>
								<span class="font-medium ml-1">{profile.story_count}</span>
							</div>
							<div>
								<span class="text-gray-500">Reputation:</span>
								<span class="font-medium ml-1">{profile.reputation_score}</span>
							</div>
						</div>
					</div>
				{/if}

				<div class="flex justify-between items-center">
					<a href="/community" class="text-gray-500 hover:text-gray-700">
						← Back to Community
					</a>
					<button
						type="submit"
						disabled={updating}
						class="bg-indigo-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{updating ? 'Updating...' : 'Update Profile'}
					</button>
				</div>
			</form>
		{/if}
	</div>
</div>