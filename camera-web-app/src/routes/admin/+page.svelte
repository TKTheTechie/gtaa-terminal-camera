<script lang="ts">
  import { currentUser, isAuthenticated } from '$lib/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import VideoFeed from '$lib/components/VideoFeed.svelte';
  import { USERS } from '$lib/config';

  // Accept SvelteKit props
  export let data: any;
  export let params: any;
  
  // Suppress unused variable warnings
  $: data, params;

  const airlineUsers = USERS.filter(user => !user.isAdmin);

  onMount(() => {
    console.log('Admin page - isAuthenticated:', $isAuthenticated);
    console.log('Admin page - currentUser:', $currentUser);
    
    // Check if user is authenticated and is admin
    if (!$isAuthenticated || !$currentUser || !$currentUser.isAdmin) {
      console.log('Admin page - not authorized, redirecting to login');
      goto('/');
      return;
    }
    
    console.log('Admin page - authorized, staying on page');
  });
</script>

<svelte:head>
  <title>GTAA Camera Feed - Admin Dashboard</title>
</svelte:head>

{#if $isAuthenticated && $currentUser && $currentUser.isAdmin}
  <div class="max-w-7xl mx-auto">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gtaa-blue mb-2">
        Admin Dashboard
      </h1>
      <p class="text-gray-600">
        Monitor all camera feeds across the Greater Toronto Airport Authority
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {#each airlineUsers as user}
        <div class="space-y-4">
          <VideoFeed username={user.username} showControls={true} isAdmin={true} />
        </div>
      {/each}
    </div>

    <div class="mt-8 card">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">System Status</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="text-center p-4 bg-green-50 rounded-lg">
          <div class="text-2xl font-bold text-green-600">{airlineUsers.length}</div>
          <div class="text-sm text-gray-600">Active Feeds</div>
        </div>
        <div class="text-center p-4 bg-blue-50 rounded-lg">
          <div class="text-2xl font-bold text-blue-600">100%</div>
          <div class="text-sm text-gray-600">Uptime</div>
        </div>
        <div class="text-center p-4 bg-purple-50 rounded-lg">
          <div class="text-2xl font-bold text-purple-600">Solace</div>
          <div class="text-sm text-gray-600">PubSub+ Connected</div>
        </div>
      </div>
    </div>

    <div class="mt-6 card">
      <h2 class="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
      <div class="flex flex-wrap gap-3">
        <button class="btn-primary">
          Refresh All Feeds
        </button>
        <button class="btn-secondary">
          Export Logs
        </button>
        <button class="btn-secondary">
          System Settings
        </button>
      </div>
    </div>
  </div>
{:else}
  <div class="flex items-center justify-center min-h-[40vh]">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gtaa-blue mx-auto mb-4"></div>
      <p class="text-gray-600">Loading...</p>
    </div>
  </div>
{/if}