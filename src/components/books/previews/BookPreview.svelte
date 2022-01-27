<template>

{#if blocks.length > 0}
<!--  {#each blocks as block, bIdx (block._id)}
    <BlockPreview
      blockRid="{block._rid}"
      block="{blockView(block)}"
      lang="{lang}"
      mode="{mode}"
      isCompleted="{isCompleted(block)}"
    />
  {/each}-->
<!--<VirtualList items={blocks} let:item
  bind:start={startBlockIdx} bind:end={endBlockIdx}
  bind:startFrom={vListStartFrom} bind:scrollTo={vListScrollTo}
  bind:startReached={startReached} bind:endReached={endReached} >
  <div class='card'>
    <BlockPreview
      blockRid="{item._rid}"
      block="{blockView(item)}"
      lang="{lang}"
      mode="{mode}"
      isCompleted="{isCompleted(item)}"
    />
  </div>
</VirtualList>-->

    <VirtualScroll bind:this={virtualList} data={blocks}
      key="_id" let:data on:scroll="{onVScroll}" keeps={20} >
      <div slot="header" id="previewScrollHeader"></div>
      <BlockPreview
        blockRid="{data._rid}"
        block="{blockView(data)}"
        lang="{lang}"
        mode="{mode}"
        isCompleted="{isCompleted(data)}"
      />
    </VirtualScroll>

{:else}<div class="content-process-run preloader-loading"></div>
{/if}

</template>

<script>
import { beforeUpdate, createEventDispatcher, tick } from 'svelte';//onMount,tick
import VirtualScroll from '../../generic/svelte-virtual-scroll-list/VirtualScroll.svelte';
import BlockPreview from './BlockPreview.svelte';

export let parlistO = {};
export let blocks = [];
export let lang = 'en';
export let mode = 'edit';
export let startId;
//export let hotkeyScrollTo;
export let currentJobInfo;

let virtualList;

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

// $: hotkeyScrolledTo(hotkeyScrollTo);
// async function hotkeyScrolledTo(hotkeyScrollTo) {
//   if (hotkeyScrollTo !== false) {
//     await tick();
//     vListScrollTo = hotkeyScrollTo;
//     //console.log('BookEdit_Display.svelte->hotkeyScrolledTo', vListScrollTo);
//   }
// }

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

const dispatch = createEventDispatcher();

const onVScroll = (ev) => {
  //console.log(`onVScroll: `, ev);
  dispatch('onScroll', ev);
}

const blockId = (blockRid) => parlistO.getBlockByRid(blockRid).blockid;
const timestamp = (new Date()).toJSON();

const blockFull = (blockRid) => {
  return parlist.has(blockId(blockRid)) ? parlist.get(blockId(blockRid)) : null;
}

const blockView = (block) => {
  if (block) {
    //let viewObj = Object.assign(block, { footnotes: block.footnotes, language: block.language || parlistO.meta.lang || lang });

    block.language = block.language || parlistO.meta.lang || lang;
    block.viewIllustration = block.illustration ? process.env.ILM_API + block.illustration + '?' + timestamp : false;

    block.isSplittedBlock = (block.voicework === 'narration' && !currentJobInfo.text_cleanup && Array.isArray(block.parts) && block.parts.length > 1 && !(currentJobInfo.mastering || currentJobInfo.mastering_complete));

    //console.log(`blockView.block: `, block);
    return block;
  } else return { footnotes: [], language: lang };
}

const isCompleted = (block) => {
  //return block ? this.tc_isCompleted(block) : true;
  return false;
}

</script>

<style>

</style>
