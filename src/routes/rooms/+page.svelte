<script lang="ts">
  import RoomList from "$lib/game/RoomList.svelte";
</script>

<svelte:head>
  <title>Room List | Indian Poker</title>
</svelte:head>

<main>
  <nav><a href="/">Indian Poker</a><a href="/create">Create New Game</a></nav>
  <h1>Room List</h1>
  <RoomList />
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
