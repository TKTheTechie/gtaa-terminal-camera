<script lang="ts">
  import { goto } from '$app/navigation';
  import { currentUser, isAuthenticated } from '$lib/stores';
  import { USERS } from '$lib/config';
  import { onMount } from 'svelte';
  import { base } from '$app/paths';

  // Accept SvelteKit props
  export let data: any;
  export let params: any;
  
  // Suppress unused variable warnings
  $: data, params;

  let username = '';
  let password = '';
  let error = '';
  let isLoading = false;

  onMount(() => {
    console.log('Login page - base path:', base);
    // Redirect if already authenticated
    if ($isAuthenticated && $currentUser) {
      const targetPath = $currentUser.isAdmin ? '/admin' : `/${$currentUser.username}`;
      console.log('Already authenticated - redirecting to:', base + targetPath);
      window.location.href = base + targetPath;
    }
  });

  async function handleLogin() {
    error = '';
    isLoading = true;

    try {
      const user = USERS.find(u => u.username === username && u.password === password);
      
      if (!user) {
        error = 'Invalid username or password';
        return;
      }

      currentUser.set(user);
      isAuthenticated.set(true);

      // Redirect based on user type
      const targetPath = user.isAdmin ? '/admin' : `/${user.username}`;
      console.log('Login successful - target path:', targetPath);
      console.log('Current base path:', base);
      
      // Workaround: manually prepend base path if goto doesn't handle it
      const fullPath = base + targetPath;
      console.log('Full path:', fullPath);
      
      // Try using window.location as a workaround
      window.location.href = fullPath;
    } catch (err) {
      error = 'Login failed. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<svelte:head>
  <title>GTAA Camera Feed - Login</title>
</svelte:head>

<div class="flex items-center justify-center min-h-[60vh]">
  <div class="card max-w-md w-full">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gtaa-blue mb-2">GTAA Camera System</h1>
      <p class="text-gray-600">Greater Toronto Airport Authority</p>
    </div>

    <form on:submit|preventDefault={handleLogin} class="space-y-6">
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
          Username
        </label>
        <input
          id="username"
          type="text"
          bind:value={username}
          on:keypress={handleKeyPress}
          class="input-field"
          placeholder="Enter your username"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          bind:value={password}
          on:keypress={handleKeyPress}
          class="input-field"
          placeholder="Enter your password"
          required
          disabled={isLoading}
        />
      </div>

      {#if error}
        <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      {/if}

      <button
        type="submit"
        class="btn-primary w-full flex items-center justify-center"
        disabled={isLoading}
      >
        {#if isLoading}
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
        {/if}
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>

    <div class="mt-8 pt-6 border-t border-gray-200">
      <h3 class="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</h3>
      <div class="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>Airlines:</div>
        <div></div>
        <div>• aircanada/aircanada</div>
        <div>• lufthansa/lufthansa</div>
        <div>• westjet/westjet</div>
        <div></div>
        <div>Admin:</div>
        <div></div>
        <div>• admin/admin</div>
        <div></div>
      </div>
    </div>
  </div>
</div>