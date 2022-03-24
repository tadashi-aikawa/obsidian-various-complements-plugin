<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let popup: string;
  export let disabled = false;

  const dispatcher = createEventDispatcher();
  const handleClick = () => {
    if (!disabled) {
      dispatcher("click");
    }
  };
</script>

<div class="wrapper">
  <button
    aria-label={popup}
    {disabled}
    on:click={handleClick}
    class={disabled ? "button-disabled" : "button-enabled"}
    style="background-color: transparent; padding: 0"
  >
    <slot />
  </button>
</div>

<style>
  .wrapper {
    display: flex;
    justify-content: center;
    margin: 0;
  }
  .button-enabled:hover {
    /*noinspection CssUnresolvedCustomProperty*/
    color: var(--interactive-accent);
  }
  .button-disabled {
    /*noinspection CssUnresolvedCustomProperty*/
    color: var(--text-muted);
  }
</style>
