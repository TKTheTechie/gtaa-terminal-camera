<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { APP_CONFIG, DEMO_MODE } from '$lib/config';
  import SolaceClient from '$lib/common/solace';

  let logs: string[] = [];
  let solaceAvailable = false;
  let factoryInitialized = false;
  let connected = false;

  function addLog(message: string) {
    logs = [...logs, `[${new Date().toLocaleTimeString()}] ${message}`];
    console.log(message);
  }

  onMount(async () => {
    addLog('=== Solace Connection Test (Using AsyncSolaceClient) ===');
    addLog(`DEMO_MODE: ${DEMO_MODE}`);
    addLog(`VITE_DEMO_MODE env: ${import.meta.env.VITE_DEMO_MODE}`);
    addLog(`Solace URL: ${APP_CONFIG.solace.url}`);
    addLog(`Solace VPN: ${APP_CONFIG.solace.vpnName}`);
    addLog(`Solace Username: ${APP_CONFIG.solace.username}`);
    
    try {
      addLog('Initializing AsyncSolaceClient...');
      solaceAvailable = true;
      factoryInitialized = true;
      addLog('✅ AsyncSolaceClient initialized');
      
      addLog('Attempting to connect to Solace broker...');
      const result = await SolaceClient.connect();
      connected = true;
      addLog(`✅ ${result}`);
      
      // Test subscription
      addLog('Testing subscription to test/topic...');
      await SolaceClient.subscribe('test/topic', (message: any) => {
        addLog(`📨 Received message on test/topic`);
      });
      addLog('✅ Successfully subscribed to test/topic');
      
      // Test publish
      addLog('Publishing test message...');
      SolaceClient.publishDirectMessage('test/topic', JSON.stringify({ 
        test: 'message',
        timestamp: new Date().toISOString()
      }));
      addLog('✅ Test message published');
      
    } catch (error: any) {
      addLog(`❌ Error: ${error.message || error}`);
      solaceAvailable = false;
      factoryInitialized = false;
      connected = false;
    }
  });

  onDestroy(async () => {
    if (connected) {
      addLog('Disconnecting from Solace...');
      try {
        await SolaceClient.disconnect();
        addLog('✅ Disconnected successfully');
      } catch (error: any) {
        addLog(`⚠️ Error during disconnect: ${error.message || error}`);
      }
    }
  });
</script>

<svelte:head>
  <title>Solace Connection Test</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
  <div class="mb-6">
    <h1 class="text-3xl font-bold text-gtaa-blue mb-2">
      Solace Connection Test
    </h1>
    <p class="text-gray-600">Diagnostic page for Solace connectivity</p>
  </div>

  <div class="card mb-6">
    <h2 class="text-xl font-semibold mb-4">Configuration</h2>
    <div class="space-y-2 text-sm font-mono">
      <div class="flex">
        <span class="w-40 text-gray-600">Demo Mode:</span>
        <span class="font-semibold {DEMO_MODE ? 'text-orange-600' : 'text-green-600'}">
          {DEMO_MODE ? 'ENABLED' : 'DISABLED'}
        </span>
      </div>
      <div class="flex">
        <span class="w-40 text-gray-600">Client:</span>
        <span class="font-semibold {solaceAvailable ? 'text-green-600' : 'text-red-600'}">
          {solaceAvailable ? 'INITIALIZED' : 'NOT INITIALIZED'}
        </span>
      </div>
      <div class="flex">
        <span class="w-40 text-gray-600">Factory Init:</span>
        <span class="font-semibold {factoryInitialized ? 'text-green-600' : 'text-gray-400'}">
          {factoryInitialized ? 'SUCCESS' : 'PENDING'}
        </span>
      </div>
      <div class="flex">
        <span class="w-40 text-gray-600">Connection:</span>
        <span class="font-semibold {connected ? 'text-green-600' : 'text-gray-400'}">
          {connected ? 'CONNECTED' : 'DISCONNECTED'}
        </span>
      </div>
      <div class="flex">
        <span class="w-40 text-gray-600">Broker URL:</span>
        <span>{APP_CONFIG.solace.url}</span>
      </div>
      <div class="flex">
        <span class="w-40 text-gray-600">VPN:</span>
        <span>{APP_CONFIG.solace.vpnName}</span>
      </div>
      <div class="flex">
        <span class="w-40 text-gray-600">Username:</span>
        <span>{APP_CONFIG.solace.username}</span>
      </div>
    </div>
  </div>

  <div class="card">
    <h2 class="text-xl font-semibold mb-4">Connection Log</h2>
    <div class="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
      {#each logs as log}
        <div>{log}</div>
      {/each}
      {#if logs.length === 0}
        <div class="text-gray-500">Waiting for logs...</div>
      {/if}
    </div>
  </div>

  <div class="mt-6 card bg-blue-50">
    <h3 class="font-semibold text-blue-900 mb-2">Instructions</h3>
    <ol class="text-sm text-blue-800 space-y-1 list-decimal list-inside">
      <li>Check the configuration values above</li>
      <li>Review the connection log for errors</li>
      <li>Open browser console (F12) for additional details</li>
      <li>This test uses the AsyncSolaceClient from src/lib/common/solace.ts</li>
      <li>If connection fails, verify broker URL and credentials in .env file</li>
      <li>Make sure a Solace broker is running (or use VITE_DEMO_MODE=true)</li>
    </ol>
  </div>
</div>