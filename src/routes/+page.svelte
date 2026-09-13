<script lang="ts">
  import { onMount } from "svelte";

  type Room = {
    name: string;
    members: number;
  };

  let rooms = $state<Room[]>([]);
  let roomName = $state("");
  let currentRoom = $state("");
  let status = $state<"disconnected" | "connecting" | "connected">(
    "disconnected",
  );

  let draft = $state("");
  let messages = $state<string[]>([]);
  let error = $state("");
  let loading = $state(false);
  let creating = $state(false);
  let socket: WebSocket | null = null;

  function showError(cause: unknown) {
    error = cause instanceof Error ? cause.message : String(cause);
  }

  async function loadRooms() {
    if (loading) return;

    loading = true;
    error = "";

    try {
      const response = await fetch("/rooms");

      if (!response.ok) {
        throw new Error(`Failed to get /rooms (${response.status})`);
      }

      rooms = await response.json();
    } catch (cause) {
      showError(cause);
    } finally {
      loading = false;
    }
  }

  async function createRoom(event: SubmitEvent) {
    event.preventDefault();

    const name = roomName.trim();
    if (!name || creating) return;

    creating = true;
    error = "";

    try {
      const response = await fetch("/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create a room (${response.status}): ${await response.text()}`,
        );
      }

      roomName = "";
      await loadRooms();
    } catch (cause) {
      showError(cause);
    } finally {
      creating = false;
    }
  }

  function joinRoom(name: string) {
    leaveRoom();

    error = "";
    messages = [];
    draft = "";
    currentRoom = name;
    status = "connecting";

    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const connection = new WebSocket(
      `${protocol}//${location.host}/rooms/${encodeURIComponent(name)}/join`,
    );

    socket = connection;

    connection.onopen = () => {
      if (socket !== connection) return;
      status = "connected";
    };

    connection.onmessage = (event) => {
      if (socket !== connection) return;

      // recent 100
      messages = [...messages, String(event.data)].slice(-100);
    };

    connection.onerror = () => {
      if (socket !== connection) return;
      error = "WebSocket error";
    };

    connection.onclose = () => {
      if (socket !== connection) return;

      socket = null;
      status = "disconnected";
      currentRoom = "";
    };
  }

  function leaveRoom() {
    const previous = socket;

    socket = null;
    previous?.close();

    status = "disconnected";
    currentRoom = "";
  }

  function sendMessage(event: SubmitEvent) {
    event.preventDefault();

    const text = draft.trim();
    if (!text || socket?.readyState !== WebSocket.OPEN) return;

    socket.send(text);
    draft = "";
  }

  onMount(() => {
    void loadRooms();

    return () => leaveRoom();
  });
</script>

<svelte:head>
  <title>Indian Poker</title>
</svelte:head>

<main>
  <h1>Indian Poker</h1>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {/if}

  <section>
    <h2>Create new room</h2>

    <form onsubmit={createRoom}>
      <input
        aria-label="New room name"
        bind:value={roomName}
        placeholder="room-a"
        title=""
        maxlength="40"
        required
      />
      <button disabled={creating}>
        {creating ? "Creating..." : "Create"}
      </button>
    </form>
  </section>

  <section>
    <h2>List</h2>

    <button onclick={loadRooms} disabled={loading}>
      {loading ? "Loading..." : "Refresh"}
    </button>

    <ul>
      {#each rooms as room (room.name)}
        <li>
          <span>{room.name} · {room.members}</span>
          <button
            onclick={() => joinRoom(room.name)}
            disabled={status !== "disconnected"}
          >
            Join
          </button>
        </li>
      {:else}
        <li>Nothing here.</li>
      {/each}
    </ul>
  </section>

  <section>
    <p>
      {#if status === "connected"}
        {currentRoom} Connected
      {:else if status === "connecting"}
        {currentRoom} Connecting...
      {:else}
        No connection
      {/if}
    </p>

    <button onclick={leaveRoom} disabled={status === "disconnected"}>
      {status === "connecting" ? "Cancel" : "Leave"}
    </button>

    <div class="messages" role="log" aria-label="Messages">
      {#each messages as message}
        <p>{message}</p>
      {/each}
    </div>

    <form onsubmit={sendMessage}>
      <input
        aria-label="Message"
        bind:value={draft}
        placeholder="Message"
        disabled={status !== "connected"}
      />
      <button disabled={status !== "connected" || !draft.trim()}>Send</button>
    </form>
  </section>
</main>

<style>
  main {
    max-width: 640px;
    margin: 40px auto;
    padding: 0 16px;
    font-family: sans-serif;
  }

  section {
    margin-top: 24px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }

  h2 {
    margin-top: 0;
    font-size: 18px;
  }

  form,
  li {
    display: flex;
    gap: 8px;
  }

  input {
    flex: 1;
    min-width: 0;
    padding: 8px;
  }

  button {
    padding: 8px 12px;
    cursor: pointer;
  }

  button:disabled {
    cursor: default;
  }

  ul {
    padding: 0;
    list-style: none;
  }

  li {
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }

  .messages {
    height: 220px;
    overflow-y: auto;
    margin: 16px 0;
    padding: 12px;
    border: 1px solid #ccc;
  }

  .messages p {
    margin: 0 0 8px;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .error {
    color: #b42318;
  }
</style>
