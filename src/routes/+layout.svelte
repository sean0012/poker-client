<script lang="ts">
  import { onMount } from "svelte";
  import favicon from "$lib/assets/favicon.svg";
  import { getGuestId } from "$lib/session/guest-session";

  let { children } = $props();
  let guestId = $state("");

  onMount(() => {
    guestId = getGuestId();
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

{#if guestId}
  <p class="session-status">Signed in as {guestId}</p>
{/if}

<style>
  .session-status {
    position: fixed;
    right: 16px;
    bottom: 16px;
    margin: 0;
    padding: 8px 12px;
    border: 1px solid #ccc;
    background: white;
    font-size: 14px;
  }
</style>
