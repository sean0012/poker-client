<script lang="ts">
  import { onMount } from "svelte";
  import { createGameClient } from "$lib/game/game-client.svelte";
  import GameControls from "$lib/game/GameControls.svelte";
  import RoomView from "$lib/game/RoomView.svelte";

  const client = createGameClient();

  onMount(() => {
    return () => client.leaveRoom();
  });
</script>

<svelte:head>
  <title>Indian Poker Server Test</title>
</svelte:head>

<main>
  <h1>Indian Poker Server Test</h1>

  {#if client.state.error}
    <p class="error" role="alert">{client.state.error}</p>
  {/if}

  <GameControls {client} />

  {#if client.state.room}
    <RoomView
      room={client.state.room}
      role={client.state.role}
      seat={client.state.seat}
      view={client.state.view}
      onViewChange={(view) => (client.state.view = view)}
    />
  {/if}
</main>

<style>
  main {
    max-width: 720px;
    margin: 32px auto;
    padding: 0 16px;
    font-family: sans-serif;
  }

  .error {
    color: #b42318;
  }
</style>
