<template>
{#if blocks.length > 0}
  <!--{#each intBlocks as block, idx (block.blockRid)}-->
  <div class="bview-container">
  {#if intBlocks.length > 0}
    <VirtualList items={intBlocks} let:item
    bind:start={startBlockIdx} bind:end={endBlockIdx}
    bind:startFrom={vListStartFrom} bind:scrollTo={vListScrollTo}
    bind:startReached={startReached} bind:endReached={endReached} >
    <div class='card'>
    <!--{item.idx}->{item.blockRid}->{item.blockId}<br/>-->
    <BookBlockDisplay
      blockRid="{item.blockRid}"
      block="{item.blockView}"
      blockListObj="{item}"
      lang="{lang}"
    />
    </div>
    </VirtualList>
    <!--{/each}-->
  {:else}<div class="content-process-run preloader-loading"></div>
  {/if}
  </div>
{/if}

</template>

<script>
  import { beforeUpdate, createEventDispatcher, tick } from 'svelte';//onMount,tick
  import VirtualList from '../generic/VirtualList.svelte';
  import BookBlockDisplay from './BookBlockDisplay.svelte';
  import suspiciousWordsHighlight from '../../store/suspiciousWordsHighlight.js';

  export let lang = 'en';
  export let blocksList = {};
  export let startId = false;
  export let hotkeyScrollTo = false;

  const { parlistO, parlist, blocks } = blocksList;
  let startBlockIdx = 0;
  let endBlockIdx = 0;
  let vListStartFrom = false;
  let vListScrollTo = false;
  let startReached = false;
  let endReached = false;
  let startIdIdx = 0;
  let fntCounter = 0;
  let loadedBookId = '';
  let intBlocks = [];
  let itemHeight = false;

  const dispatch = createEventDispatcher();

  $: scrolledTo(startBlockIdx);
  function scrolledTo(startBlockIdx) {
    if (blocks[startBlockIdx]) {
      if (vListStartFrom) {
        vListStartFrom = false;
        return;
      }
      if (vListScrollTo) {
        vListScrollTo = false;
        //return;
      }
      dispatch('setStart', {
        blockIdx: startBlockIdx,
        blockId: blocks[startBlockIdx],
        blockRid: blockRid(blocks[startBlockIdx])
      });
    }
  }

  $: scrolledToEdge(startReached, endReached);
  function scrolledToEdge(startReached, endReached) {
    dispatch('setEdge', {
      startReached: startReached,
      endReached: endReached,
    });
  }

  $: hotkeyScrolledTo(hotkeyScrollTo);
  async function hotkeyScrolledTo(hotkeyScrollTo) {
    if (hotkeyScrollTo !== false) {
      await tick();
      vListScrollTo = hotkeyScrollTo;
      console.log('BookEdit_Display.svelte->hotkeyScrolledTo', vListScrollTo);
    }
  }

  beforeUpdate(/*async*/ () => {
    //console.log('beforeUpdate', 'blocks.length:', blocks.length, 'parlistO.meta.bookid:', parlistO.meta.bookid, 'loadedBookId:', loadedBookId);
    if (parlistO.meta.bookid && blocks.length && loadedBookId === '' || (loadedBookId !== '' && loadedBookId !== parlistO.meta.bookid)) {

      //fntCounter = 0; uncomment for through numeration
      loadedBookId = parlistO.meta.bookid;
      startIdIdx = -1;

      intBlocks = blocks.map((blockId, i)=>{
        let block = {};
        fntCounter = 0;

        block.blockView = blockView(blockId);
        block.blockRid = block.blockView.blockRid;
        block.blockId = blockId;
        block.idx = i;

        if (startId && blockId === startId) {
          startIdIdx = i;
        }

        return block;
      })

      if (startId && startIdIdx < 0) { // came from disabled block
        let outId = parlistO.getOutId(startId);
        while (outId !== false && blocks.indexOf(outId) < 0) {
          outId = parlistO.getOutId(outId);
        }
        if (outId) {
          hotkeyScrollTo = blocks.indexOf(outId) + ':' + Date.now();
        }
      }

      if (startIdIdx > 0) {
        vListStartFrom = startIdIdx;
      }
    }
  });

  /*onMount(async () => {
    console.log('onMount1', 'blocks.length:', blocks.length);
    await tick();
    console.log('onMount2', 'blocks.length:', blocks.length);
  });*/

  const timestamp = (new Date()).toJSON();

  const blockId = (blockRid) => parlistO.getBlockByRid(blockRid).blockid;
  const blockRid = (blockId) => {
    return parlist.has(blockId) ? parlist.get(blockId)._rid : null;
  }

  const blockFull = (blockId) => {
    return parlist.has(blockId) ? parlist.get(blockId) : null;
  }

  const getOutPaddings = (block) => {
    if (block) {
      //console.log('blockOutPaddings');
      return (block.classes && block.classes.hasOwnProperty('outsize-padding')) ? block.classes['outsize-padding'] : ''
    } else return '';
  }

  const getIllustration = (block) => {
    return (block && block.getIllustration) ? block.getIllustration() : '';
  }

  const getParnum = (block) => {
    if (block) {
      if (block.type == 'header' && block.isNumber && !block.isHidden) {
        return block.secnum;
      }
      else if (block.type == 'par' && block.isNumber && !block.isHidden) {
        return block.parnum;
      }
    }
    return false;
  }

  const blockView = (blockId) => {
    let block = blockFull(blockId);
    let blockO = parlistO.getBlockByRid(block._rid);
    if (block) {
      //console.log('blockView', block.blockid, fntCounter);
      let viewObj = { footnotes: block.footnotes, language: block.language || lang };
      viewObj.getIllustration = ()=>{
        if (block.illustration) {
          return process.env.ILM_API + block.illustration + '?' + timestamp;
        }
      }
      viewObj.blockRid = block._rid;
      viewObj.getClass = block.getClass;
      viewObj.blockid = block.blockid;
      viewObj.classes = block.classes;
      viewObj.type = block.type;
      viewObj.isNumber = blockO.isNumber;
      viewObj.isHidden = blockO.isHidden;
      viewObj.secnum = blockO.secnum;
      viewObj.parnum = blockO.parnum;

      viewObj.illustration_height = block.illustration_height;
      viewObj.illustration_width = block.illustration_width;
      viewObj.description = block.description;

      viewObj.disabled = block.disabled || false;

      //viewObj.content = block.content

      viewObj.content = block.content.replace(
        /<sup\s*data-pg\s*=\s*['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
        '<span data-pg="$1"></span>'
      );
      //<sup class="service-info" data-pg="xxiii"><w class="service-info" data-sugg="">pg </w><w class="service-info" data-sugg="">xxiii</w></sup>
      viewObj.content = viewObj.content.replace(
        /<sup(?=\s)\s*class=['"]{1}service-info['"]{1}\s*data-pg=['"]{1}(.*?)['"]{1}[^>]*>.*?<\/sup>/mig,
        '<span class="service-info" data-pg="$1"></span>'
      );

      let ftnIdx = 0;
      viewObj.content = viewObj.content.replace(
        /<sup\s*data-idx\s*=\s*?['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
        (idx)=>{
          if (typeof viewObj.footnotes[ftnIdx] !== 'undefined') {
            viewObj.footnotes[ftnIdx].ftnIdx = fntCounter;
          }
          ftnIdx++;
          return `<sup data-idx="${fntCounter++}">[${fntCounter}]</sup>`
        }
      );
      //<sup class="service-info" data-idx="2"><w class="service-info" data-sugg="">2</w></sup>
      viewObj.content = viewObj.content.replace(
        /<sup(?=\s)\s*?class=['"]{1}service-info['"]{1}\s*?data-idx\s*=\s*['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
        (idx)=>{
          if (typeof viewObj.footnotes[ftnIdx] !== 'undefined') {
            viewObj.footnotes[ftnIdx].ftnIdx = fntCounter;
          }
          ftnIdx++;
          return `<sup class="service-info" data-idx="${fntCounter++}">[${fntCounter}]</sup>`
        }
      );
      viewObj.content = suspiciousWordsHighlight.clearText(viewObj.content);
      if (Array.isArray(viewObj.footnotes)) {
        viewObj.footnotes.forEach((ftn) => {
          ftn.content = suspiciousWordsHighlight.clearText(ftn.content);
        });
      }
      if (viewObj.description) {
        viewObj.description = suspiciousWordsHighlight.clearText(viewObj.description);
      }

      viewObj.viewOutPaddings = getOutPaddings(block);
      viewObj.viewIllustration = getIllustration(block);
      viewObj.viewParnum = getParnum(viewObj);

      return viewObj;
    } else return { footnotes: [], language: lang };
  }

</script>

<style>
  .bview-container {
    min-height: 200px;
    /*height: calc(100vh - 15em);*/
    height: 100%;
    width: 100%;
  }

  .card::after {
    clear: both;
    display: block;
  }

</style>
