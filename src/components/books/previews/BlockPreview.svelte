<template>
<!--{blockRid}->{block.type}->{block._id}->{block.isSplittedBlock}-->
{#if block && block._id}
  <div id="v-{block._id}" data-rid="{blockRid}" class="row content-scroll-item back" class:-disabled-block="{block.disabled}">
    <div class='col'>
      <div blockid="{block._id}">
        <div class="block-preview">

          <div class="table-body -block -mode-{mode} -voicework-{block.voicework} {blockOutPaddings()}">
            <div class="table-cell controls-left">
              <!--<div class="table-row">/div>-->
              <div class="table-body check-row"><div class="table-cell"></div></div>
            </div>
            <!--<div class="table-cell controls-left">-->

            <div class="table-cell marks-block-left"></div>

            <div class="-content-block table-cell" class:completed="{isCompleted}">
              <div class="table-body -content -langblock-{getBlockLang()}">
                <div class="table-row-flex controls-top">
                  <div class="par-ctrl -par-num">{#if getParnum()}<span class="par-num has-num">{getParnum()}</span>{/if}</div>
                </div>
                <!--<div class="table-row-flex controls-top">-->

                {#each blockParts() as blockPart, blockPartIdx}
                <!--BookBlockPartPreview-->
                <div class="block-preview">
                  <div class="table-body -block -subblock {blockOutPaddings()}">
                    {#if mode === 'narrate'}
                      <div class="table-cell controls-left sub-parnum"></div>
                    {/if}
                    <div class="table-cell" class:completed="{isCompleted}">
                      <div class="table-body -content">
                        {#if mode !== 'narrate'}
                          <div class="table-row-flex controls-top">
                            <div class="par-ctrl -par-num">
                              {#if block.isSplittedBlock}
                                <span>{getSubParnum(blockPartIdx)}</span>
                              {/if}
                            </div>
                          </div>
                        {/if}
                        <div class="table-row ilm-block">
                          {#if mode === 'narrate'}
                            <div class="table-cell controls-left audio-controls"></div>
                          {/if}
                          <div class="table-cell -content-wrapper">

                            {#if block.type === 'hr'}
                              <hr class="{block.getClass()}" />
                            {:else if block.type === 'illustration'}
                              <div class="table-body illustration-block {block.getClass()}">

                                {#if block.imgProps.url}
                                  <ImgPreview
                                      block="{block}"
                                      height="{block.imgProps.height}"
                                    />
                                {:else}
                                  {#await getImgProps(block.imgUrl)}
                                    <div class="bview-empty-image-wrapper">
                                      <div class="bview-empty-image">No image</div>
                                    </div>
                                  {:then imgProps}
                                    <ImgPreview
                                      block="{block}"
                                      height="{block.illustration_height || imgProps.height}"
                                    />
                                  {/await}

                                {/if}

                                {#if allowEditing()}
                                  <div class="table-row drag-uploader no-picture" class:__hidden="{isChanged() && !isIllustrationChanged()}">
                                    <div class="preview-container"></div>
                                  </div>
                                {/if}
                              </div>
                              <!--<div class="table-body illustration-block">-->
                              <div class="table-row content-description {block.getClass()}">
                                <div class="content-wrap-desc description">
                                  {@html block.description}
                                </div>
                              </div>
                              <!--<div class="table-row content-description-->
                            {:else} <!--block.type == par, h-->
                              <div class="content-wrap-preview part-{blockPartIdx} {block.getClass(mode)}">
                                {@html blockPart.content}
                              </div>
                              <!--<div class="content-wrap-preview-->
                            {/if}

                          </div>
                          <!--<div class="table-cell -content-wrapper">-->
                        </div>
                        <!--<div class="table-row ilm-block">-->
                      </div>
                      <!--<div class="table-body -content">-->
                    </div>
                    <!--<div class="table-cell"-->
                  </div>
                </div>
                <!--<div class="block-preview">-->
                <div class="table-body">
                  {#if block.isSplittedBlock}
                    <div class="table-row controls-bottom">
                      <div class="controls-bottom-wrapper">
                        <div class="-left">
                          <span>
                            <i class="glyphicon"></i>
                          </span>
                        </div>
                      </div>
                    </div>
                  {/if}
                </div>
                <!--<div class="table-body">-->
                <!--/BookBlockPartPreview-->
                {/each}

                {#if block.footnotes.length > 0 && mode !== 'narrate'}
                <div class="table-row content-footnotes">
                  {#each block.footnotes as footnote, ftnIdx}
                  <div class="table-body footnote">

                    <div class="table-row controls-top" class:completed="{isCompleted}">
                    </div>

                    <div class="table-row">
                      <div class="table-cell -num">{ftnIdx+1}.</div>
                      <div class="content-wrap-footn-preview table-cell -text -langftn-{getFtnLang(footnote.language)}">
                        {@html footnote.content}
                      </div>
                      <div class="table-cell -control"></div>
                    </div>
                    <!--<div class="table-row">-->

                  </div>
                  <!--<div class="table-body footnote"-->
                  {/each}
                </div>
                <!--<div class="table-row content-footnotes"-->
                {/if}

              </div>
              <!--<div class="table-body -content -->

              <div class="table-body">
                <div class="table-row controls-bottom">
                  <div class="controls-bottom-wrapper">
                    <div class="-left">
                      <span>
                        <i class="glyphicon"></i>
                      </span>
                    </div>
                  </div>
                </div>
                <!--<div class="table-row controls-bottom">-->
              </div>
              <!--<div class="table-body">-->

            </div>
            <!--<div class="-content-block table-cell" -->

            <div class="table-cell controls-right"></div>

          </div>
          <!--<div class="table-body -block-->

        </div>
        <!--<div class="block-preview">-->
        <div class="ilm-block flag-popup-container"></div>
        <!--<div class="ilm-block flag-popup-container">-->
      </div>
      <!--<div blockid=-->
    </div>
    <!-- <div class='col'>-->
  </div>
  <!--<div id="v--->
{:else}
  <div class="ilm-block ilm-display content-process-run preloader-loading"></div>
{/if}
<!--<div class="clearfix"></div>-->
</template>
<script>
  import { onMount } from 'svelte';
  //import { fade } from 'svelte/transition';
  import ImgPreview from './ImgPreview.svelte';

  export let block;
  export let blockRid = '';
  export let mode = 'edit';
  export let lang = 'en';
  export let isCompleted = false;

  let footNotes = {};

  /*let getRandomInt = (min, max)=>{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }*/
  //let rand = getRandomInt(0, 200);

  //beforeUpdate(/*async */() => {
    //console.log(`beforeUpdate.blockid: `, block._id, getParnum());
  //});

  onMount(async () => {
    const blockEditRef = document.getElementById(block._id);
    if (blockEditRef) {
      const blockVirtRef = document.getElementById('v-' + block._id);
      if (blockVirtRef) {
        const blockEditRect = blockEditRef ? blockEditRef.getBoundingClientRect() : { height: 0 };
        const bodyStyle = blockEditRef.currentStyle || window.getComputedStyle(blockEditRef);
        const marginTop = parseFloat(bodyStyle.marginTop);
        const marginBottom = parseFloat(bodyStyle.marginBottom);
        blockVirtRef.style.height = `${blockEditRect.height + marginTop + marginBottom}px`;
        blockVirtRef.style.overflow = `hidden`;
      }
    }
    //await tick();
  });

  const getImgProps = (imgUrl = false) => {
    return new Promise((resolve, reject) => {
      if (!imgUrl) return resolve(block.imgProps);
      if (block.imgProps.url && block.imgProps.url == imgUrl) {
        return resolve(block.imgProps);
      }

      const img = new Image();

      img.onload = function() {
        block.imgProps.width  = this.width;
        block.imgProps.height = this.height;
        block.imgProps.url    = imgUrl;
        resolve(block.imgProps);
      };

      img.src = imgUrl;

    })
  }

  const blockOutPaddings = () => {
    return (mode !== 'narrate' && block.classes && block.classes.hasOwnProperty('outsize-padding')) ? block.classes['outsize-padding'] : ''
  }

  const blockParts = () => {
    if (!block) {
      return [{}];
    }
    if (block.isSplittedBlock) {
      return block.parts;
    } else {
      return [
        {
          content: block.content,
          blockId: block._id,
          audiosrc: block.audiosrc,
          audiosrc_ver: block.audiosrc_ver,
          manual_boundaries: block.manual_boundaries
        }
      ];
    }
  }

  const getBlockLang = () => {
    if (block.language && block.language.length) {
      return block.language;
    } else {
      return lang;
    }
  }

  const getFtnLang = (ftnLang) => {
    if (ftnLang && ftnLang.length) {
      return ftnLang;
    } else {
      return lang;
    }
  }

  const allowEditing = () => {
    //return this.block && this.tc_isShowEdit(this.block._id) && this.mode === 'edit';
    return true;
  }

  const isChanged = () => {
    return false;
  }

  const isIllustrationChanged = () => {
    return block.isIllustrationChanged;
  }

  const getParnum = () => {
    //console.log(`getParnum: block.type:${block.type} block.secnum:${block.secnum} block.parnum: ${block.parnum}`);
    if (block.type == 'header'/* && block.isNumber && !block.isHidden*/) {
      return block.secnum;
    }
    else if (block.type == 'par'/* && block.isNumber && !block.isHidden*/) {
      return block.parnum;
    }
    else return false;
  }

  const getSubParnum = (blockPartIdx) => {
    //console.log(`getSubParnum: block.type:${block.type} block.secnum:${block.secnum} block.parnum: ${block.parnum}`);
    if (mode === 'narrate') {
      if (!block.parnum) {
        return '';
      }
      return isSplittedBlock ? `${block.parnum}_${blockPartIdx+1}` : block.parnum;
    }
    return (block.parnum ? `${block.parnum}_` : '') + (blockPartIdx+1);
  }

</script>

<style>
  .content-wrap-preview {
    min-height: 50px;
  }
</style>
