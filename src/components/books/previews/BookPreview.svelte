<template>

<!--{#each blocks as block, bIdx (block._id)}
  <p>#{bIdx} {block._id} {JSON.stringify(block)}
  <div class="row content-scroll-item back">
    <div class='col'>=====================================================</div>
  </div>
{/each}-->
{#if blocks.length > 0}
<VirtualList items={blocks} let:item
  bind:start={startBlockIdx} bind:end={endBlockIdx}
  bind:startFrom={vListStartFrom} bind:scrollTo={vListScrollTo}
  bind:startReached={startReached} bind:endReached={endReached} >
  <div class='card'>
    #{item._id} {JSON.stringify(item)}<br/>
  </div>
</VirtualList>
{:else}<div class="content-process-run preloader-loading"></div>
{/if}

</template>

<script>
import { beforeUpdate, createEventDispatcher, tick } from 'svelte';//onMount,tick
import VirtualList from '../../generic/VirtualList.svelte';

export let parlistO = {};
export let blocks = [];
export let lang = 'en';
export let startId;
export let hotkeyScrollTo;

//let blocks = parlistO.listObjs;
//let blocksVuew = [];
let bookId = parlistO.meta.bookid || false;
let loadedBookId = '';
let startBlockIdx = 0;
let endBlockIdx = 0;
let vListStartFrom = false;
let vListScrollTo = false;
let startReached = false;
let endReached = false;
let startIdIdx = 0;
let fntCounter = 0;
let prevBlocksLength = 0;

//$: prepareBlockPreview()
$: hotkeyScrolledTo(hotkeyScrollTo);
async function hotkeyScrolledTo(hotkeyScrollTo) {
  if (hotkeyScrollTo !== false) {
    await tick();
    vListScrollTo = hotkeyScrollTo;
    //console.log('BookEdit_Display.svelte->hotkeyScrolledTo', vListScrollTo);
  }
}

beforeUpdate(/*async */() => {

  //console.log('beforeUpdate', 'blocks.length:', blocks.length, 'bookId:', bookId, 'loadedBookId:', loadedBookId);
  if (startId && false) console.log('startId', startId);
//   if (blocks.length > prevBlocksLength) {
//       blocksVuew = blocks;
//       //blocksVuew = blocksVuew;
//   } else {
//       blocksVuew = blocks;
//   }
//   prevBlocksLength = blocks.length;
//   if (bookId && blocks.length && loadedBookId === '' || (loadedBookId !== '' && loadedBookId !== bookId)) {
//     //fntCounter = 0; uncomment for through numeration
//     loadedBookId = bookId;
//     for (let i = 0; i < blocks.length; i++) {
//       fntCounter = 0;
//       blocks[i].blockView = blockView(blocks[i].blockRid);
//       blocks[i].visible = blocks[i].loaded;
//       blocks[i].idx = i;
//       if (startId && blocks[i].blockId == startId) {
//         startIdIdx = i;
//       }
//     }
//     //intBlocks = blocks;
//     if (startIdIdx > 0) {
//       vListStartFrom = startIdIdx;
//     }
//   }
});

const blockId = (blockRid) => parlistO.getBlockByRid(blockRid).blockid;

const blockFull = (blockRid) => {
  return parlist.has(blockId(blockRid)) ? parlist.get(blockId(blockRid)) : null;
}

const blockView = (blockRid) => {
  const block = blockFull(blockRid);
  const blockO = parlistO.getBlockByRid(blockRid);
  if (block) {
    let viewObj = { footnotes: block.footnotes, language: block.language || parlistO.meta.lang || lang };
    return viewObj;
  } else return { footnotes: [], language: lang };
}

</script>

<style>

</style>
