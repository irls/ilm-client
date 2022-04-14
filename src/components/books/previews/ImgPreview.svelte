<template>
<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
  alt="{cleanAlt(block.description)}"
  class="{block.getClass()}"
  width="auto"
  height="{height}"
  style="background-color: #EEEEEE"
/>
</template>

<script>
import { beforeUpdate} from 'svelte';//onMount, createEventDispatcher, tick

export let block = {};
export let height = 100;

beforeUpdate(/*async */() => {
  //console.log('beforeUpdate', 'blocks.length:', blocks.length, 'bookId:', bookId, 'loadedBookId:', loadedBookId);
});

const cleanAlt = (description) => {
  return description.replace(/<[^>]*>?/gm, '');
}

</script>

<style>

</style>
