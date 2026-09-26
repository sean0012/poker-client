<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import GameView from "$lib/game/GameView.svelte";
  import { createGameClient } from "$lib/game/game-client.svelte";
  import type { Role } from "$lib/game/types";

  const client = createGameClient();

  async function loadGame() {
    const gameId = page.params.game;
    if (!gameId) return;

    client.state.gameId = gameId;
    await client.getGameInfo();

    const requestedRole = page.url.searchParams.get("role");
    if (
      client.state.game &&
      (requestedRole === "player" || requestedRole === "spectator")
    ) {
      client.joinGame(requestedRole as Role);
    }
  }

  onMount(() => {
    void loadGame();
    return () => client.leaveGame();
  });
</script>

<svelte:head>
  <title>{client.state.game?.name ?? page.params.game} | Indian Poker</title>
</svelte:head>

<main>
  <nav>
    <a href="/">Indian Poker</a>
    <a href="/games">View Games</a>
  </nav>
  <h1>{client.state.game?.name ?? page.params.game}</h1>

  {#if client.state.error}
    <p class="error" role="alert">{client.state.error}</p>
  {/if}

  <div class="actions">
    <button
      type="button"
      onclick={client.getGameInfo}
      disabled={client.state.busy || client.state.status === "connecting"}
    >
      {client.state.busy ? "Requesting..." : "Get Game Info"}
    </button>
    <button
      type="button"
      onclick={client.leaveGame}
      disabled={client.state.status === "disconnected"}
    >
      {client.state.status === "connecting"
        ? "Cancel Connection"
        : "Leave Game"}
    </button>
  </div>

  {#if client.state.status === "connecting"}
    <p aria-live="polite">Joining...</p>
  {:else if client.state.status === "connected"}
    <p aria-live="polite">
      {client.state.role === "player"
        ? `Player · Seat ${client.state.seat}`
        : "Spectator"}
      Connected
    </p>
  {/if}

  {#if client.state.game}
    <GameView
      game={client.state.game}
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

  nav,
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  nav a {
    color: inherit;
  }

  button {
    padding: 10px;
    font: inherit;
    cursor: pointer;
  }

  .actions {
    margin: 20px 0 12px;
  }

  .error {
    color: #b42318;
  }
</style>
