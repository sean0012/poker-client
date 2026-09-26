<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import GameControls from "$lib/game/GameControls.svelte";
  import { createGameClient } from "$lib/game/game-client.svelte";

  const client = createGameClient();

  function openCreatedGame() {
    if (client.state.game) {
      void goto(
        `/games/${encodeURIComponent(client.state.game.id)}?role=player`,
      );
    }
  }

  onMount(() => {
    return () => client.leaveGame();
  });
</script>

<svelte:head>
  <title>Create New Game | Indian Poker</title>
</svelte:head>

<main>
  <nav><a href="/">Indian Poker</a><a href="/games">View Games</a></nav>
  <h1>Create New Game</h1>

  {#if client.state.error}
    <p class="error" role="alert">{client.state.error}</p>
  {/if}

  <GameControls {client} onCreated={openCreatedGame} />
</main>

<style>
  main {
    max-width: 720px;
    margin: 32px auto;
    padding: 0 16px;
    font-family: sans-serif;
  }

  nav {
    display: flex;
    gap: 12px;
  }

  nav a {
    color: inherit;
  }

  .error {
    color: #b42318;
  }
</style>
