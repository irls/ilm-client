<template>
<!--{blockRid}->{blockListObj.blockId}->{blockListObj.loaded}->{blockListObj.visible}-->
{#if block && block.getClass}
  <div data-rid="{blockRid}" id="{block.blockid}" data-id="{block.blockid}" class="ilm-block ilm-display -langblock-{block.language} {blockOutPaddings()}">
  {#if block.type === 'illustration'}
    <img alt="block.blockid" class="{block.getClass()}" src="{getIllustration()}"/>
  {:else if block.type === 'hr'}
    <hr class="{block.getClass()}"/>
  {:else}
    {#if getParnum()}
      <div class="bview-parnum">{getParnum()}</div>
    {/if}

    <div id="display-{block.blockid}" lang="{block.language}"
      class="bview-content part-0 {block.getClass ? block.getClass() : ''} hide-archive"
      data-parnum="{getParnum()}"
      data-type="{block.type}"
      on:click={handleFootnote}>
      {#if blockListObj.loaded}{@html block.content}{/if}
    </div>

    {#if block.footnotes.length > 0}
    <div class="footnotes">
      {#each block.footnotes as footnote, footnoteIdx}
      <div class="-hidden" bind:this={footNotes[footnote.ftnIdx]}>
        <div class="-langftn-{footnote.language}">
          <div class="-num">[fn{footnote.ftnIdx+1}]</div>
          <div  class="-text">
            {@html footnote.content}
          </div>
        </div>
      </div>
      {/each}
    </div>
    {/if}

  {/if}
  </div>
{:else}
  <div class="ilm-block ilm-display content-process-run preloader-loading"></div>
{/if}
<div class="clearfix"></div>
</template>
<script>

  //import { fade } from 'svelte/transition';

  export let block;
  export let blockListObj;
  export let idx;
  export let blockRid = '';
  export let isLoaded = false;

  let footNotes = {};

  let getRandomInt = (min, max)=>{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }
  //let rand = getRandomInt(0, 200);

  const getIllustration = () => {
    return (block && block.getIllustration) ? block.getIllustration() : '';
  }

  const blockOutPaddings = () => {
    if (block) {
      console.log('blockOutPaddings');
      return (block.classes && block.classes.hasOwnProperty('outsize-padding')) ? block.classes['outsize-padding'] : ''
    } else return '';
  }

  const getParnum = () => {
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

  const handleFootnote = (ev) => {
    if (ev.target.dataset.idx && footNotes[ev.target.dataset.idx]) {
      let className = footNotes[ev.target.dataset.idx].className;
      if (className == '-hidden') {
        footNotes[ev.target.dataset.idx].className = '';
      } else footNotes[ev.target.dataset.idx].className = '-hidden';
    }
  }

</script>

<style>
  .ilm-block.ilm-display {
    position: relative;
  }
  .bview-parnum {
    padding-top: 10px;
    font-family: GentiumPlus, 'Georgia', 'serif';
    padding-left: 15px;
    color: rgba(26, 26, 26, 0.7);
    font-size: 12px;
    cursor: pointer;
    position: absolute;
    left: 0px;
    /*font-family: 'Georgia', 'serif';
    font-size: 10px;*/
  }
</style>
