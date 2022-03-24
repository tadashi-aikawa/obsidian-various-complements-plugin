<!--suppress LabeledStatementJS -->
<script lang="ts">
  import ObsidianButton from "./ObsidianButton.svelte";
  import { File } from "svelte-lucide-icons";
  import ObsidianIconButton from "./ObsidianIconButton.svelte";
  import { Word } from "../../model/Word";
  import { onMount } from "svelte";

  type Dictionary = {
    id: string;
    path: string;
  };

  export let dictionaries: Dictionary[];
  export let selectedDictionary: Dictionary;
  export let word: string = "";
  export let description: string = "";
  export let aliases: string[] = [];

  export let onSubmit: (dictionaryPath: string, word: Word) => void;
  export let onClickFileIcon: (dictionaryPath: string) => void;

  let aliasesStr = aliases.join("\n");

  $: enableSubmit = word.length > 0;

  const handleSubmit = () => {
    onSubmit(selectedDictionary.path, {
      value: word,
      description,
      createdPath: selectedDictionary.path,
      aliases: aliasesStr.split("\n"),
      type: "customDictionary",
    });
  };

  let wordRef = null;
  onMount(() => {
    setTimeout(() => wordRef.focus(), 50);
  });
</script>

<div class="number">
  <h2>Add a word to a custom dictionary</h2>

  <h3>Dictionary</h3>
  <div style="display: flex; gap: 10px">
    <select bind:value={selectedDictionary} class="dropdown">
      {#each dictionaries as dictionary}
        <option value={dictionary}>
          {dictionary.path}
        </option>
      {/each}
    </select>
    <ObsidianIconButton
      popup="Open the file"
      on:click={() => onClickFileIcon(selectedDictionary.path)}
    >
      <File />
    </ObsidianIconButton>
  </div>

  <h3>Word</h3>
  <textarea
    bind:value={word}
    style="width: 100%;"
    rows="5"
    bind:this={wordRef}
  />

  <h3>Description</h3>
  <input type="text" bind:value={description} style="width: 100%;" />

  <h3>Aliases (for each line)</h3>
  <textarea bind:value={aliasesStr} style="width: 100%;" rows="5" />

  <div style="text-align: center; width: 100%; padding-top: 15px;">
    <ObsidianButton disabled={!enableSubmit} on:click={handleSubmit}
      >Submit!</ObsidianButton
    >
  </div>
</div>

<style>
</style>
