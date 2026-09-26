<script lang="ts">
</script>

<svelte:head>
  <title>Indian Poker</title>
</svelte:head>

<main>
  <h1>Indian Poker</h1>

  <nav aria-label="Main navigation">
    <a href="/create">Create New Game</a>
    <a href="/games">View Games</a>
  </nav>
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
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 24px;
  }

  a {
    padding: 10px 14px;
    border: 1px solid #ccc;
    color: inherit;
  }
</style>
