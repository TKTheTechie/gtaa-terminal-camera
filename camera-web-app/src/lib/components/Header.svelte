<script lang="ts">
  import { currentUser, isAuthenticated } from '../stores';
  import { goto } from '$app/navigation';

  function logout() {
    currentUser.set(null);
    isAuthenticated.set(false);
    goto('/');
  }
</script>

<header class="bg-gtaa-blue text-white shadow-lg">
  <div class="container mx-auto px-4 py-4">
    <div class="flex justify-between items-center">
      <div class="flex items-center space-x-4">
        <h1 class="text-2xl font-bold">GTAA</h1>
        <span class="text-lg">Camera Feed System</span>
      </div>
      
      {#if $isAuthenticated && $currentUser}
        <div class="flex items-center space-x-4">
          <span class="text-sm">Welcome, {$currentUser.username}</span>
          <button 
            on:click={logout}
            class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
          >
            Logout
          </button>
        </div>
      {/if}
    </div>
  </div>
</header>