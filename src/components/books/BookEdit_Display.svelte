<template>
{#if blocks.length > 0}
{#each blocks as block, idx (block.blockRid)}
<!--{block.blockRid}->{block.blockId}->{block.loaded}<br/>-->
<!--<BookBlockDisplay
  block="{block}"
  lang="{lang}"
/>-->
<BookBlockDisplay
  blockRid="{block.blockRid}"
  block="{block.blockView}"
  blockListObj="{block}"
  idx="{idx}"
  lang="{lang}"
/>

{/each}
{/if}
</template>

<script>
  import { beforeUpdate } from 'svelte';
  import BookBlockDisplay from './BookBlockDisplay.svelte';
  export let lang = 'en';
  export let blocks = [];
  export let parlistO = {};
  export let parlist = {};
  let fntCounter = 0;
  //let blockPromise = new Promise();
  let intBlocks = [];
  let blockIdx = 0;

  beforeUpdate(() => {
    console.log('the component is about to update');
    fntCounter = 0;
    if (blocks.length) {
      for (let i = 0; i < blocks.length; i++) {
        blocks[i].blockView = blockView(blocks[i].blockRid);
        blocks[i].visible = blocks[i].loaded;
      }
      //intBlocks = blocks;
      let found = blocks.find(function(el, idx) {
        if (parlistO.getBlockByRid(el.blockRid).loaded === false) {
          blockIdx = idx;
          return true;
        }
        return false;
      });
      if (found) {
        startTimer();
      }
    }
  });

//   onMount(() => {
//     console.log('onMount blocks', blocks);
//   });

var myDelay = 1000;
var thisDelay = 1000;
var start = Date.now();

function startTimer() {
    setTimeout(function() {
        // your code here...
        let execCount = 100;
        let i;
        for (i = 0; i < blocks.length; i++) {
          if (execCount <= 0) break;
          if (parlistO.getBlockByRid(blocks[i].blockRid).visible === false) {
            //console.log(blocks[i].blockRid, blocks[i].blockId);
            let blockDOMId = `display-${blocks[i].blockId}`;
          //console.log('blockDOMId', blockDOMId, blocks[i].blockRid);
            document.getElementById(blockDOMId).insertAdjacentHTML('afterbegin', blocks[i].blockView.content);
            parlistO.setVisible(blocks[i].blockRid);
            execCount--;
          }
        }
        //console.log('i', i);

        // calculate the actual number of ms since last time
        var actual = Date.now() - start;
        // subtract any extra ms from the delay for the next cycle
        thisDelay = myDelay - (actual - myDelay);
        start = Date.now();
        // start the timer again
        if (i < blocks.length) {
          startTimer();
        } else {
          console.log('done', i);
        }
    }, thisDelay);
}

  const timestamp = (new Date()).toJSON();

  const blockId = (blockRid) => parlistO.getBlockByRid(blockRid).blockid;

  const blockFull = (blockRid) => {
    return parlist.has(blockId(blockRid)) ? parlist.get(blockId(blockRid)) : null;
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

      return viewObj;
    } else return { footnotes: [], language: lang };
  }

</script>
