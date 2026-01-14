<script lang="ts">
  import { page } from '$app/stores';
  import { currentUser, isAuthenticated } from '$lib/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import VideoFeed from '$lib/components/VideoFeed.svelte';
  import ConnectionStatus from '$lib/components/ConnectionStatus.svelte';
  import { SolaceVideoClient } from '$lib/solace';
  import { APP_CONFIG } from '$lib/config';

  // Accept SvelteKit props
  export let data: any;
  export let params: any;
  
  // Suppress unused variable warnings
  $: data, params;

  $: username = $page.params.username || '';
  
  let client: SolaceVideoClient | null = null;
  let activeVideoTopic: string = '';
  let connectionError = '';
  let isConnected = false;

  onMount(async () => {
    // Check if user is authenticated and authorized
    if (!$isAuthenticated || !$currentUser) {
      goto('/');
      return;
    }

    // Check if user is trying to access their own feed or is admin
    if ($currentUser.username !== username && !$currentUser.isAdmin) {
      goto('/');
      return;
    }

    // Connect to Solace and set up video topic
    await connectToSolace();
  });

  async function connectToSolace() {
    try {
      connectionError = '';

      // Create client and connect (it will load Solace internally)
      client = new SolaceVideoClient(APP_CONFIG.solace);
      await client.connect();
      isConnected = true;

      // Set the active video topic directly
      activeVideoTopic = `${APP_CONFIG.videoFeedTopic}/${username}`;
      console.log('Connected to Solace, using video topic:', activeVideoTopic);

    } catch (error) {
      console.error('Failed to connect to Solace:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to connect to Solace';
      connectionError = errorMsg;
      isConnected = false;
      
      // Still set the topic for potential retry
      activeVideoTopic = `${APP_CONFIG.videoFeedTopic}/${username}`;
    }
  }
</script>

<svelte:head>
  <title>GTAA Camera Feed - {username}</title>
</svelte:head>

{#if $isAuthenticated && $currentUser}
  <div class="max-w-4xl mx-auto">
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gtaa-blue mb-2">
        Camera Feed Dashboard
      </h1>
      <p class="text-gray-600">
        Viewing camera feed for: <span class="font-semibold">{username}</span>
      </p>
    </div>

    <ConnectionStatus {isConnected} connectionError={connectionError} />

    {#if activeVideoTopic}
      <VideoFeed username={username} videoTopic={activeVideoTopic} showControls={true} />

      <div class="mt-8 card">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">Feed Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700">User:</span>
            <span class="ml-2 text-gray-600">{username}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">Active Feed Topic:</span>
            <span class="ml-2 text-gray-600 font-mono text-xs">{activeVideoTopic}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">Status:</span>
            <span class="ml-2 text-green-600">Active</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">Connection:</span>
            <span class="ml-2 text-green-600">Solace PubSub+</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <div class="flex items-center justify-center min-h-[40vh]">
    <div class="text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gtaa-blue mx-auto mb-4"></div>
      <p class="text-gray-600">Loading...</p>
    </div>
  </div>
{/if}