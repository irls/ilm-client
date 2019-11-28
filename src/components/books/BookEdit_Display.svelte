<template>
{#if intBlocks.length > 0}
{#each intBlocks as block, idx (block.blockRid)}
<!--{idx}->{block.blockRid}->{block.blockId}->{block.loaded}<br/>-->

<BookBlockDisplay
  blockRid="{block.blockRid}"
  block="{block.blockView}"
  blockListObj="{block}"
  lang="{lang}"
/>

{/each}
{/if}
</template>

<script>
  import { beforeUpdate } from 'svelte';//onMount,tick
  import BookBlockDisplay from './BookBlockDisplay.svelte';

  export let lang = 'en';
  export let blocks = [];
  export let parlistO = {};
  export let parlist = {};
  export let startId;
  export let reloadBook = false;

  let fntCounter = 0;
  let scrollCounter = 0;
  let loadedBookId = '';
  //let blockPromise = new Promise();
  let intBlocks = [];
  let blockIdx = 0;

  beforeUpdate(() => {
    //console.log('beforeUpdate', 'blocks.length:', blocks.length, 'parlistO.meta.bookid:', parlistO.meta.bookid, 'loadedBookId:', loadedBookId);
    //loadedBookId = parlistO.meta.bookid;

    fntCounter = 0;
    if (parlistO.meta.bookid && blocks.length && loadedBookId === '' || (loadedBookId !== '' && loadedBookId !== parlistO.meta.bookid)) {
      loadedBookId = parlistO.meta.bookid;
      console.log('beforeUpdate, loadedBookId', loadedBookId);
      for (let i = 0; i < blocks.length; i++) {
        blocks[i].blockView = blockView(blocks[i].blockRid);
        blocks[i].visible = blocks[i].loaded;
        if (startId && blocks[i].blockId == startId) {
          scrollCounter = 5;
        }
        if (scrollCounter > 0) {// set to visible blocks near startId
          blocks[i].loaded = true;
          blocks[i].visible = true;
          scrollCounter--;
        }
      }
      intBlocks = blocks;
      //console.log('beforeUpdate', intBlocks.length);
      let found = blocks.find(function(el, idx) {
        if (parlistO.getBlockByRid(el.blockRid).loaded === false) {
          blockIdx = idx;
          return true;
        }
        return false;
      });
      if (found) {
        startShowTimer();
      }
    }
    if (reloadBook) {
      blocks = [];
      reloadBook = false;
      if (loadedBookId !== '') loadedBookId = '';
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
          scrollToBlock(startId);
          wasScrolled = !wasScrolled;
        }
        let i, execCount = 100;
        for (i = 0; i < intBlocks.length; i++) {
          if (execCount <= 0) break;
          if (intBlocks[i].visible === false) {
            //console.log('setTimeout'/*, intBlocks[i].blockView.type, intBlocks[i].blockRid, intBlocks[i].blockId*/);
            let blockDOMId = `display-${intBlocks[i].blockId}`;
            let blockElement = document.getElementById(blockDOMId);
            //parlistO.setVisible(intBlocks[i].blockRid);
            intBlocks[i].visible = true;
//             if (blockElement) {
//               blockElement.innerHTML = "";
//               blockElement.insertAdjacentHTML('afterbegin', intBlocks[i].blockView.content);
//               intBlocks[i].visible = true;
//               //parlistO.setVisible(intBlocks[i].blockRid);
//             }
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
    let vBlock = document.getElementById(blockId);
    if (vBlock) {
      //console.log('vBlock', vBlock);
      vBlock.scrollIntoView();
    }
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
