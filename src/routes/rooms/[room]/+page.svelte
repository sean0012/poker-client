<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import RoomView from "$lib/game/RoomView.svelte";
  import { createGameClient } from "$lib/game/game-client.svelte";
  import type { Role } from "$lib/game/types";

  const client = createGameClient();

  async function loadRoom() {
    const roomName = page.params.room;
    if (!roomName) return;

    client.state.roomName = roomName;
    await client.getRoomInfo();

    const requestedRole = page.url.searchParams.get("role");
    if (
      client.state.room &&
      (requestedRole === "player" || requestedRole === "spectator")
    ) {
      client.joinRoom(requestedRole as Role);
    }
  }

  onMount(() => {
    void loadRoom();
    return () => client.leaveRoom();
  });
</script>

<svelte:head>
  <title>{page.params.room} | Indian Poker</title>
</svelte:head>

<main>
  <nav>
    <a href="/">Indian Poker</a>
    <a href="/rooms">View Room List</a>
  </nav>
  <h1>{page.params.room}</h1>

  {#if client.state.error}
    <p class="error" role="alert">{client.state.error}</p>
  {/if}

  <div class="actions">
    <button
      type="button"
      onclick={client.getRoomInfo}
      disabled={client.state.busy || client.state.status === "connecting"}
    >
      {client.state.busy ? "Requesting..." : "Get Room Info"}
    </button>
    <button
      type="button"
      onclick={client.leaveRoom}
      disabled={client.state.status === "disconnected"}
    >
      {client.state.status === "connecting" ? "Cancel Connection" : "Leave Room"}
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
