<template>

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

</template>

<script>
  import { beforeUpdate, createEventDispatcher, tick } from 'svelte';//onMount,tick
  import VirtualList from '../generic/VirtualList.svelte';
  import BookBlockDisplay from './BookBlockDisplay.svelte';

  export let lang = 'en';
  export let parlistO = {};
  export let parlist = {};
  export let startId;
  export let hotkeyScrollTo = false;

  let blocks = parlistO.listObjs;
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
        return;
      }
      dispatch('setStart', {
        blockIdx: startBlockIdx,
        blockId: blocks[startBlockIdx].blockId,
        blockRid: blocks[startBlockIdx].blockRid
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
    //console.log('hotkeyScrollTo', hotkeyScrollTo);
    if (hotkeyScrollTo !== false) {
//       await tick();
//       vListScrollTo = 0;
      await tick();
      vListScrollTo = hotkeyScrollTo;
    }
  }

  beforeUpdate(/*async */() => {
    //console.log('beforeUpdate', 'blocks.length:', blocks.length, 'parlistO.meta.bookid:', parlistO.meta.bookid, 'loadedBookId:', loadedBookId, 'reloadBook', reloadBook);
    //loadedBookId = parlistO.meta.bookid;
    if (parlistO.meta.bookid && blocks.length && loadedBookId === '' || (loadedBookId !== '' && loadedBookId !== parlistO.meta.bookid)) {

      fntCounter = 0;
      loadedBookId = parlistO.meta.bookid;
      //console.log('beforeUpdate, loadedBookId', loadedBookId);
      //console.log('beforeUpdate, blocks.length', blocks.length);
      for (let i = 0; i < blocks.length; i++) {
        blocks[i].blockView = blockView(blocks[i].blockRid);
        blocks[i].visible = blocks[i].loaded;
        blocks[i].idx = i;
        if (startId && blocks[i].blockId == startId) {
          /*scrollCounter = 5;*/
          startIdIdx = i;
        }
        /*if (scrollCounter > 0) {// set to visible blocks near startId
          blocks[i].loaded = true;
          blocks[i].visible = true;
          scrollCounter--;
        }*/
      }
      intBlocks = blocks;
      //await tick();
      //console.log('startId', startId, 'startIdIdx', startIdIdx);
      //console.log('beforeUpdate', intBlocks.length);
      if (startIdIdx > 0) {
        vListStartFrom = startIdIdx;
      }
      /*let found = blocks.find(function(el, idx) {
        //console.log('blocks.find', parlistO.getBlockByRid(el.blockRid).blockid, parlistO.getBlockByRid(el.blockRid).loaded);
        if (parlistO.getBlockByRid(el.blockRid).loaded === false) {
          blockIdx = idx;
          return true;
        }
        return false;
      });
      if (found) {
        startShowTimer();
      }*/
    }
  });

  /*onMount(async () => {
    console.log('onMount1', 'blocks.length:', blocks.length);
    await tick();
    console.log('onMount2', 'blocks.length:', blocks.length);
  });*/

  let myDelay = 1000;
  let thisDelay = 1000;
  let start = Date.now();
  let checkCount = 0;
  let wasScrolled = false;

  function startShowTimer() {
    setTimeout(function() {
        if (startId && !wasScrolled) {
          //scrollToBlock(startId);
          wasScrolled = !wasScrolled;
        }
        let i, execCount = 100;
        for (i = 0; i < intBlocks.length; i++) {
          if (execCount <= 0) break;
          if (intBlocks[i].visible === false) {
            //console.log('setTimeout'/*, intBlocks[i].blockView.type, intBlocks[i].blockRid, intBlocks[i].blockId*/);
            //let blockDOMId = `display-${intBlocks[i].blockId}`;
            //let blockElement = document.getElementById(blockDOMId);
            //parlistO.setVisible(intBlocks[i].blockRid);
            intBlocks[i].visible = true;
            execCount--;
            checkCount++;
          }
        }
        // calculate the actual number of ms since last time
        var actual = Date.now() - start;
        // subtract any extra ms from the delay for the next cycle
        thisDelay = myDelay - (actual - myDelay);
        start = Date.now();
        // start the timer again
        if (i < intBlocks.length) {
          startShowTimer();
        } else {
          console.log('done', i, checkCount, startId);
          //if (startId) scrollToBlock(startId);
        }
    }, thisDelay);
  }

  const scrollToBlock = (blockId) => {
    console.log('scrollToBlockSvelte', blockId);
    vListStartFrom = 100;
  }

  const timestamp = (new Date()).toJSON();

  const blockId = (blockRid) => parlistO.getBlockByRid(blockRid).blockid;

  const blockFull = (blockRid) => {
    return parlist.has(blockId(blockRid)) ? parlist.get(blockId(blockRid)) : null;
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

  const blockView = (blockRid) => {
    let block = blockFull(blockRid);
    let blockO = parlistO.getBlockByRid(blockRid);
    if (block) {
      //console.log('blockView', block.blockid, fntCounter);
      let viewObj = { footnotes: block.footnotes, language: block.language || lang };
      viewObj.getIllustration = ()=>{
        if (block.illustration) {
          return process.env.ILM_API + block.illustration + '?' + timestamp;
        }
      }
      viewObj.getClass = block.getClass;
      viewObj.blockid = block.blockid;
      viewObj.classes = block.classes;
      viewObj.type = block.type;
      viewObj.isNumber = blockO.isNumber;
      viewObj.isHidden = blockO.isHidden;
      viewObj.secnum = blockO.secnum;
      viewObj.parnum = blockO.parnum;

      //viewObj.content = block.content

      viewObj.content = block.content.replace(
        /[\s]*?<sup[\s]*?data-pg[\s]*?=[\s]*?['"]+(.*?)['"]+.*?>.*?<\/sup>/mig,
        '<span data-pg="$1"></span>'
      );
      //<sup class="service-info" data-pg="xxiii"><w class="service-info" data-sugg="">pg </w><w class="service-info" data-sugg="">xxiii</w></sup>
      viewObj.content = viewObj.content.replace(
        /[\s]*?<sup(?=\s)\s*?class=['"]{1}service-info['"]{1}\s*?data-pg=['"]{1}(.*?)['"]{1}[^>]*>.*?<\/sup>/mig,
        '<span class="service-info" data-pg="$1"></span>'
      );

      let ftnIdx = 0;
      viewObj.content = viewObj.content.replace(
        /[\s]*?<sup[\s]*?data-idx[\s]*?=[\s]*?['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
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
        /[\s]*?<sup(?=\s)\s*?class=['"]{1}service-info['"]{1}\s*?data-idx[\s]*?=[\s]*?['"]+(.*?)['"]+[^>]*>.*?<\/sup>/mig,
        (idx)=>{
          if (typeof viewObj.footnotes[ftnIdx] !== 'undefined') {
            viewObj.footnotes[ftnIdx].ftnIdx = fntCounter;
          }
          ftnIdx++;
          return `<sup class="service-info" data-idx="${fntCounter++}">[${fntCounter}]</sup>`
        }
      );

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

  .card {
    position: relative;
    min-height: 5em;
  }

  .card::after {
    clear: both;
    display: block;
  }
</style>
