<script lang="ts">
  import { onMount } from "svelte";
  import type { Game } from "./types";

  let games = $state<Game[]>([]);
  let busy = $state(false);
  let error = $state("");

  async function loadGames() {
    busy = true;
    error = "";

    try {
      const response = await fetch("/games");
      if (!response.ok) {
        throw new Error(`${response.status}: ${await response.text()}`);
      }

      games = await response.json();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      busy = false;
    }
  }

  onMount(() => {
    void loadGames();
  });
</script>

<section>
  <div class="heading">
    <h2>Games</h2>
    <button type="button" onclick={loadGames} disabled={busy}>
      {busy ? "Refreshing..." : "Refresh"}
    </button>
  </div>

  {#if error}
    <p class="error" role="alert">{error}</p>
  {:else if busy && games.length === 0}
    <p>Loading games...</p>
  {:else if games.length === 0}
    <p>No games available.</p>
  {:else}
    <ul>
      {#each games as game (game.id)}
        <li>
          <div>
            <strong>{game.name}</strong>
            <span
              >{game.players.filter((player) => player.connected).length}/2
              players connected</span
            >
          </div>
          <div class="actions">
            <a href={`/games/${encodeURIComponent(game.id)}?role=player`}
              >Join as Player</a
            >
            <a href={`/games/${encodeURIComponent(game.id)}?role=spectator`}
              >Join as Spectator</a
            >
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>

<style>
  section {
    margin-top: 20px;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
  }

  .heading,
  li,
  .actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .heading,
  li {
    justify-content: space-between;
  }

  h2 {
    margin: 0;
  }

  button,
  a {
    padding: 10px;
    font: inherit;
  }

  a {
    color: inherit;
  }

  ul {
    display: grid;
    gap: 12px;
    padding: 0;
    list-style: none;
  }

  li {
    flex-wrap: wrap;
    padding: 12px 0;
    border-bottom: 1px solid #eee;
  }

  li > div:first-child {
    display: grid;
    gap: 4px;
  }

  span {
    color: #666;
    font-size: 14px;
  }

  .error {
    color: #b42318;
  }

  @media (max-width: 560px) {
    .heading,
    li {
      align-items: stretch;
      flex-direction: column;
    }
  }
</style>
