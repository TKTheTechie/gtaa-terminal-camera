<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  // Accept the data prop that SvelteKit passes to layouts (unused but required)
  export let data: any;
  
  // Suppress unused variable warning
  $: data;

  // Handle GitHub Pages SPA redirect
  onMount(() => {
    const redirect = $page.url.searchParams.get('redirect');
    if (redirect) {
      // Remove the redirect parameter and navigate to the intended path
      goto(redirect, { replaceState: true });
    }
  });
</script>

<div class="min-h-screen bg-gtaa-gray">
  <Header />
  <main class="container mx-auto px-4 py-8">
    <slot />
  </main>
</div>