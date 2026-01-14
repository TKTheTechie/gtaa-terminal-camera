<script lang="ts">
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  
  // Accept the data prop that SvelteKit passes to layouts (unused but required)
  export let data: any;
  
  // Suppress unused variable warning
  $: data;
</script>

<div class="min-h-screen bg-gtaa-gray">
  <Header />
  <main class="container mx-auto px-4 py-8">
    <slot />
  </main>
</div>