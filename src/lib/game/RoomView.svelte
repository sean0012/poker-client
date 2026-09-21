<script lang="ts">
  import HoverCount from "./HoverCount.svelte";
  import type { Gaze, Role, Room } from "./types";

  type Props = {
    room: Room;
    role: Role | null;
    seat: number | null;
    view: Gaze;
    onViewChange: (view: Gaze) => void;
  };

  let { room, role, seat, view, onViewChange }: Props = $props();

  const me = $derived(room.players.find((player) => player.seat === seat));

  const opponent = $derived(
    seat === null
      ? undefined
      : room.players.find((player) => player.seat !== seat),
  );
</script>

<section>
  <h2>{room.name}</h2>

  <p>Spectators: {room.spectators}</p>
  <HoverCount label="Total deck size" value={room.deck_size} />

  <ul>
    {#each room.players as player (player.seat)}
      <li>
        <strong>Player {player.seat}</strong>
        · {player.connected ? "Connected" : "Empty seat"}
        · Server gaze: {player.gaze}

        <HoverCount label="Starting chips" value={player.initial_chips} />
      </li>
    {/each}
  </ul>

  <p class="hint">
    Hover over a number or focus it with the keyboard to reveal its value. Room
    information reflects the state at the time it was fetched.
  </p>
</section>

{#if role === "player" && me && opponent}
  <section>
    <h2>Player View</h2>

    <div class="actions">
      <button
        aria-pressed={view === "opponent"}
        onclick={() => onViewChange("opponent")}
      >
        View Opponent
      </button>

      <button
        aria-pressed={view === "table"}
        onclick={() => onViewChange("table")}
      >
        View My Chips / Table
      </button>
    </div>

    <div class="view">
      {#if view === "opponent"}
        <h3>Opponent · Player {opponent.seat}</h3>
        <p>{opponent.connected ? "Connected" : "Waiting for opponent"}</p>

        <div class="placeholder">Opponent face area</div>
        <div class="placeholder">Opponent card · Not dealt yet</div>

        <HoverCount
          label="Opponent chip stack"
          value={opponent.current_chips}
        />
        <HoverCount label="Cards remaining" value={room.remaining_cards} />
      {:else}
        <h3>My Chips and Table</h3>

        <HoverCount label="My chip stack" value={me.current_chips} />
        <HoverCount label="Pot" value={room.pot} />
      {/if}
    </div>

    <p class="hint">
      View changes apply only to this screen and are not sent to the server.
    </p>
  </section>
{:else}
  <section>
    <h2>{role === "spectator" ? "Spectator View" : "Room Status Preview"}</h2>

    {#each room.players as player (player.seat)}
      <p>
        <HoverCount
          label={`Player ${player.seat} current chips`}
          value={player.current_chips}
        />
      </p>
    {/each}

    <HoverCount label="Cards remaining" value={room.remaining_cards} />
    <HoverCount label="Pot" value={room.pot} />
  </section>
{/if}

<section>
  <h2>Game History</h2>

  <ol>
    {#each room.history as entry}
      <li>{entry}</li>
    {/each}
  </ol>

  {#if room.history.length === 0}
    <p>No game history yet.</p>
  {/if}
</section>

<style>
  section {
    margin-top: 20px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }

  h2 {
    margin-top: 0;
    font-size: 20px;
  }

  button {
    padding: 10px;
    font: inherit;
    cursor: pointer;
  }

  button[aria-pressed="true"] {
    border: 2px solid #2563eb;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  li {
    margin: 12px 0;
  }

  .view {
    min-height: 200px;
    margin-top: 16px;
    padding: 16px;
    border: 1px dashed #aaa;
  }

  .placeholder {
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid #ccc;
  }

  .hint {
    color: #666;
    font-size: 14px;
  }
</style>
