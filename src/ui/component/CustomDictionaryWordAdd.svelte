<!--suppress LabeledStatementJS -->
<script lang="ts">
  import ObsidianButton from "./ObsidianButton.svelte";
  import { File } from "svelte-lucide-icons";
  import ObsidianIconButton from "./ObsidianIconButton.svelte";
  import type { Word } from "../../model/Word";
  import { onMount } from "svelte";

  type Dictionary = {
    id: string;
    path: string;
  };

  export let dictionaries: Dictionary[];
  export let selectedDictionary: Dictionary;
  export let word: string = "";
  export let useDisplayedWord = false;
  export let displayedWord: string = "";
  export let description: string = "";
  export let aliases: string[] = [];
  export let dividerForDisplay = "";

  export let onSubmit: (dictionaryPath: string, word: Word) => void;
  export let onClickFileIcon: (dictionaryPath: string) => void;

  let aliasesStr = aliases.join("\n");
  let wordRef = null;
  let displayedWordRef = null;

  $: enableSubmit = word.length > 0;
  $: enableDisplayedWord = Boolean(dividerForDisplay);
  $: firstWordTitle = useDisplayedWord ? "Inserted word" : "Word";
  $: {
    if (useDisplayedWord) {
      displayedWordRef?.focus();
    }
  }

  const handleSubmit = () => {
    onSubmit(selectedDictionary.path, {
      value: displayedWord
        ? `${displayedWord}${dividerForDisplay}${word}`
        : word,
      description,
      createdPath: selectedDictionary.path,
      aliases: aliasesStr.split("\n"),
      type: "customDictionary",
    });
  };

  onMount(() => {
    setTimeout(() => wordRef.focus(), 50);
  });
</script>

<div>
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

  <h3>{firstWordTitle}</h3>
  <textarea
    bind:value={word}
    style="width: 100%;"
    rows="3"
    bind:this={wordRef}
  />

  {#if enableDisplayedWord}
    <label>
      <input type="checkbox" bind:checked={useDisplayedWord} />
      Distinguish between display and insertion
    </label>
  {/if}

  {#if useDisplayedWord}
    <h3>Displayed Word</h3>
    <textarea
      bind:value={displayedWord}
      style="width: 100%;"
      rows="3"
      bind:this={displayedWordRef}
    />
  {/if}

  <h3>Description</h3>
  <input type="text" bind:value={description} style="width: 100%;" />

  <h3>Aliases (for each line)</h3>
  <textarea bind:value={aliasesStr} style="width: 100%;" rows="3" />

  <div style="text-align: center; width: 100%; padding-top: 15px;">
    <ObsidianButton disabled={!enableSubmit} on:click={handleSubmit}
      >Submit</ObsidianButton
    >
  </div>
</div>

<style>
</style>
