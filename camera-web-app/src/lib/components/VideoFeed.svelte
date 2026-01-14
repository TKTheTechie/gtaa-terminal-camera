<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { SolaceVideoClient } from '../solace';
  import { APP_CONFIG } from '../config';
  import { activeCamera } from '../stores';

  export let username: string;
  export let videoTopic: string = '';
  export let showControls = false;
  export let isAdmin = false;

  let videoElement: HTMLImageElement;
  let client: SolaceVideoClient;
  let isConnected = false;
  let connectionStatus = 'Disconnected';
  let frameCount = 0;
  let lastFrameTime = Date.now();
  let fps = 0;
  let errorMessage = '';
  let isInactive = true; // Start with inactive overlay

  // Check if this camera is the active one
  $: isActive = $activeCamera === username;

  // Use provided videoTopic or fallback to default
  $: topic = videoTopic || `${APP_CONFIG.videoFeedTopic}/${username}`;

  onMount(async () => {
    // Connect to Solace (it will load the library internally)
    await connectToSolace();
  });

  async function connectToSolace() {
    try {
      connectionStatus = 'Connecting...';
      errorMessage = '';
      
      client = new SolaceVideoClient(APP_CONFIG.solace);
      await client.connect();
      
      connectionStatus = 'Connected';
      isConnected = true;
      
      client.subscribe(topic, (imageData: string) => {
        // Check for inactive state
        if (imageData === 'INACTIVE') {
          isInactive = true;
          return;
        }
        
        // Normal frame processing
        isInactive = false;
        
        if (videoElement) {
          videoElement.src = imageData;
          frameCount++;
          
          // Calculate FPS
          const now = Date.now();
          if (now - lastFrameTime >= 1000) {
            fps = Math.round((frameCount * 1000) / (now - lastFrameTime));
            frameCount = 0;
            lastFrameTime = now;
          }
        }
      });
    } catch (error) {
      console.error('Failed to connect to video feed:', error);
      connectionStatus = 'Connection Failed';
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      isConnected = false;
    }
  }

  onDestroy(() => {
    if (client) {
      try {
        client.unsubscribe(topic);
        client.disconnect();
      } catch (error) {
        console.error('Error during cleanup:', error);
      }
    }
  });

  function sendControlMessage() {
    if (client && client.isSessionConnected()) {
      client.publishControl(APP_CONFIG.videoFeedControlTopic, {
        controlTopic: username
      });
      // Update the active camera
      activeCamera.set(username);
    } else {
      console.warn('Cannot send control message: Solace session not connected');
    }
  }

  function reconnect() {
    if (client) {
      client.disconnect();
    }
    connectToSolace();
  }
</script>

<div class="card">
  <div class="mb-4">
    <div class="flex items-center justify-between mb-2">
      <h3 class="text-lg font-semibold text-gray-800">
        Camera Feed: {username}
      </h3>
      {#if isActive}
        <span class="px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded">
          ACTIVE
        </span>
      {/if}
    </div>
    <p class="text-sm text-gray-600 mb-1">Topic: {topic}</p>
    <div class="flex items-center space-x-4 text-sm">
      <span class="flex items-center">
        <div class="w-2 h-2 rounded-full mr-2 {isConnected ? 'bg-green-500' : 'bg-red-500'}"></div>
        {connectionStatus}
      </span>
      {#if isConnected}
        <span class="text-gray-600">FPS: {fps}</span>
      {/if}
      {#if !isConnected && connectionStatus === 'Connection Failed'}
        <button 
          on:click={reconnect}
          class="text-blue-600 hover:text-blue-800 text-xs underline"
        >
          Retry
        </button>
      {/if}
    </div>
    {#if errorMessage}
      <p class="text-xs text-red-600 mt-1">{errorMessage}</p>
    {/if}
  </div>

  <div class="relative bg-black rounded-lg overflow-hidden" style="aspect-ratio: 4/3;">
    {#if isConnected}
      {#if isInactive}
        <!-- Inactive overlay -->
        <div class="flex items-center justify-center h-full bg-black">
          <div class="text-white text-4xl font-bold">
            INACTIVE
          </div>
        </div>
      {:else}
        <!-- Active video feed -->
        <img 
          bind:this={videoElement}
          alt="Video feed for {username}"
          class="w-full h-full object-contain"
          on:error={() => console.warn('Image load error')}
        />
        <div class="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
          Live
        </div>
      {/if}
    {:else}
      <div class="flex items-center justify-center h-full text-white">
        <div class="text-center">
          {#if connectionStatus === 'Connecting...'}
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
          {:else if connectionStatus === 'Connection Failed'}
            <div class="text-red-400 mb-2">
              <svg class="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
          {/if}
          <p class="text-sm">{connectionStatus}</p>
          {#if errorMessage}
            <p class="text-xs text-red-400 mt-1">{errorMessage}</p>
          {/if}
        </div>
      </div>
    {/if}
  </div>

  {#if showControls}
    <div class="mt-4 flex space-x-3">
      {#if isAdmin}
        <button 
          on:click={sendControlMessage}
          disabled={!isConnected || isActive}
          class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          title={isActive ? 'This camera is already active' : 'Make this camera active'}
        >
          {isActive ? 'Active Camera' : 'Make Camera Active'}
        </button>
      {/if}
      {#if !isConnected}
        <button 
          on:click={reconnect}
          class="btn-secondary"
        >
          Reconnect
        </button>
      {/if}
    </div>
  {/if}
</div>