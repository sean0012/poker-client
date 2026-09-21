<script lang="ts">
  let { label, value }: { label: string; value: number } = $props();
</script>

<button type="button" class="count">
  {label}
  <span class="value">{value}</span>
</button>

<style>
  .count {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    margin: 4px 0;
    padding: 10px;
    font: inherit;
    cursor: pointer;
  }

  .value {
    min-width: 3ch;
    opacity: 0;
  }

  .count:hover .value,
  .count:focus .value {
    opacity: 1;
  }
</style>
