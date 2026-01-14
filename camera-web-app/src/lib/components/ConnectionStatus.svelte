<script lang="ts">
  import { APP_CONFIG, DEMO_MODE } from '../config';

  export let isConnected: boolean = false;
  export let connectionError: string = '';
</script>

<div class="card mb-6">
  <h3 class="text-lg font-semibold text-gray-800 mb-3">Connection Status</h3>
  
  <div class="space-y-3">
    <!-- Demo Mode Indicator -->
    {#if DEMO_MODE}
      <div class="flex items-center space-x-2 text-orange-600">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
        </svg>
        <span class="font-medium">Demo Mode Active</span>
      </div>
      <p class="text-sm text-gray-600">
        The application is running in demo mode with simulated video feeds. 
        To connect to a real Solace broker, update your <code class="bg-gray-100 px-1 rounded">.env</code> file.
      </p>
    {:else}
      <!-- Real Connection Status -->
      <div class="flex items-center space-x-2">
        <div class="w-3 h-3 rounded-full {isConnected ? 'bg-green-500' : 'bg-red-500'}"></div>
        <span class="font-medium {isConnected ? 'text-green-700' : 'text-red-700'}">
          {isConnected ? 'Connected to Solace PubSub+' : 'Disconnected'}
        </span>
      </div>

      {#if connectionError}
        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-sm font-medium text-red-800 mb-1">Connection Error:</p>
          <p class="text-xs text-red-700">{connectionError}</p>
        </div>
      {/if}

      <!-- Connection Details -->
      <div class="text-xs text-gray-600 space-y-1">
        <div><span class="font-medium">Broker URL:</span> {APP_CONFIG.solace.url}</div>
        <div><span class="font-medium">VPN:</span> {APP_CONFIG.solace.vpnName}</div>
        <div><span class="font-medium">Username:</span> {APP_CONFIG.solace.username}</div>
      </div>
    {/if}
  </div>
</div>