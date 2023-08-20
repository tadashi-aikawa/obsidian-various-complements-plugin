<script lang="ts">
  import { createEventDispatcher } from "svelte";

  export let popup: string = "";
  export let disabled = false;

  const dispatcher = createEventDispatcher();
  const handleClick = () => {
    dispatcher("click");
  };
</script>

<button
  aria-label={popup}
  class:mod-cta={!disabled}
  {disabled}
  on:click={handleClick}
>
  <slot />
</button>
