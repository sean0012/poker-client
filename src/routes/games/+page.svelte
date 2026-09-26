<script lang="ts">
  import GameList from "$lib/game/GameList.svelte";
</script>

<svelte:head>
  <title>Games | Indian Poker</title>
</svelte:head>

<main>
  <nav><a href="/">Indian Poker</a><a href="/create">Create New Game</a></nav>
  <h1>Games</h1>
  <GameList />
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
</style>
