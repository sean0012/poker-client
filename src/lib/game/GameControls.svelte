<script lang="ts">
  import type { GameClient } from "./game-client.svelte";

  let {
    client,
    onCreated,
  }: { client: GameClient; onCreated?: () => void } = $props();

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    await client.createGame();
    if (client.state.room) onCreated?.();
  }
</script>

<section>
  <h2>Game Room</h2>

  <form onsubmit={submit}>
    <fieldset
      disabled={client.state.busy || client.state.status !== "disconnected"}
    >
      <label>
        Room name
        <input
          bind:value={client.state.roomName}
          maxlength="40"
          title="Use 1 to 40 characters"
          required
        />
      </label>

      <label>
        Deck size
        <input
          type="number"
          bind:value={client.state.deckSize}
          min="10"
          max="4294967295"
          step="10"
          required
        />
      </label>

      <label>
        Player 1 starting chips
        <input
          type="number"
          bind:value={client.state.firstChips}
          min="1"
          max="4294967295"
          step="1"
          required
        />
      </label>

      <label>
        Player 2 starting chips
        <input
          type="number"
          bind:value={client.state.secondChips}
          min="1"
          max="4294967295"
          step="1"
          required
        />
      </label>

      <button type="submit">Create New Game</button>
    </fieldset>
  </form>

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

  fieldset {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    border: 0;
  }

  label {
    display: grid;
    gap: 6px;
  }

  input,
  button {
    padding: 10px;
    font: inherit;
  }

  button {
    cursor: pointer;
  }

  button:disabled {
    cursor: default;
  }

</style>
