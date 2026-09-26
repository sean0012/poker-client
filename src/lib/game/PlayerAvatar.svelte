<script lang="ts">
  import puppyAvatar from "$lib/assets/character0.png";

  let {
    seat,
    avatar,
    size = "large",
  }: { seat: number; avatar: string; size?: "large" | "small" } = $props();
</script>

<figure class:small={size === "small"} data-avatar={avatar}>
  <img src={puppyAvatar} alt={`Player ${seat}, puppy avatar`} />
</figure>

<style>
  figure {
    width: min(100%, 280px);
    aspect-ratio: 1;
    margin: 0 auto 12px;
    overflow: hidden;
    background: #fff;
  }

  figure.small {
    width: min(100%, 180px);
    margin-bottom: 8px;
  }

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
</style>
