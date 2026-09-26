<script lang="ts">
  import { onMount } from "svelte";
  import favicon from "$lib/assets/favicon.svg";
  import {
    initializeGuestSession,
    type GuestSession,
  } from "$lib/session/guest-session";

  let { children } = $props();
  let guestSession = $state<GuestSession | null>(null);
  let sessionError = $state("");
  let sessionLoading = $state(true);

  async function initializeSession() {
    sessionLoading = true;
    sessionError = "";
    try {
      guestSession = await initializeGuestSession();
    } catch (cause) {
      sessionError = cause instanceof Error ? cause.message : String(cause);
    } finally {
      sessionLoading = false;
    }
  }

  onMount(() => {
    void initializeSession();
  });
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if sessionLoading}
  <p class="session-status" aria-live="polite">Starting guest profile...</p>
{:else if sessionError}
  <div class="session-error" role="alert">
    <p>Unable to start a guest profile: {sessionError}</p>
    <button type="button" onclick={initializeSession}>Retry</button>
  </div>
{:else}
  {@render children()}
{/if}

{#if guestSession}
  <p class="session-status">Guest · {guestSession.user_id}</p>
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

  .session-error {
    max-width: 720px;
    margin: 32px auto;
    padding: 16px;
    color: #b42318;
  }

  button {
    padding: 8px 12px;
    font: inherit;
  }
</style>
