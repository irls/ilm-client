<template>
<!--{blockRid}->{block.type}->{block._id}-->
{#if block && block._id}
  <div id="{block._id}" data-rid="{blockRid}" class="row content-scroll-item back">
    <div class='col'>
      <div blockid="{block._id}">
        <div class="block-preview">

          <div class="table-body -block -mode-{mode} -voicework-{block.voicework} {blockOutPaddings()}">
            <div class="table-cell controls-left">
              <div class="table-row"></div>
              <div class="table-row check-row"></div>
            </div>
            <!--<div class="table-cell controls-left">-->

            <div class="-content-block table-cell" class:completed="{isCompleted}">
              <div class="table-body -content -langblock-{getBlockLang()}">
                <div class="table-row-flex controls-top">
                  <div class="par-ctrl -par-num"><span class="par-num has-num">{getParnum()}</span></div>
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
                          <div class="table-row-flex controls-top"></div>
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
                                {#await getImgProps(block.viewIllustration)}
                                  <div class="bview-empty-image-wrapper">
                                    <div class="bview-empty-image">No image</div>
                                  </div>
                                {:then imgProps}
                                  {#if imgProps.url}
                                  <img src="{imgProps.url}"
                                      alt="{block.description}"
                                      class="{block.getClass()}"
                                      width="auto"
                                      height="{block.illustration_height || imgProps.height}"/>
                                  {:else}
                                  <!--<img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
                                      alt="{block.description}"
                                      class="{block.getClass()}"
                                      width="{imgProps.width}"
                                      height="{imgProps.height}"
                                      style="background-color: #EEEEEE" />-->
                                  <div style="height: 10px"></div>
                                  {/if}
                                {/await}
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
                              <div class="content-wrap-preview {block.getClass(mode)}">
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
                  {#if isSplittedBlock()}
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
      </div>
    </div>
  </div>

<!--  <div data-rid="{blockRid}" id="{block.blockid}" data-id="{block.blockid}" class="ilm-block ilm-display -langblock-{block.language} {block.viewOutPaddings}" style="/*min-height:{block.illustration_height}px*/">
  {#if block.type === 'illustration'}
    {#await getImgProps(block.viewIllustration)}
      <div class="bview-empty-image-wrapper">
        <div class="bview-empty-image">No image</div>
      </div>
    {:then imgProps}
      <img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
           alt="{block.description}"
           class="{block.getClass()}"
           width="{imgProps.width}"
           height="{imgProps.height}"
           style="border:1px solid" />
    {/await}
    {#if block.description}
      <div class="bview-image-descr-wrapper">
        {@html block.description}
      </div>
    {/if}
  {:else if block.type === 'hr'}
    <hr class="{block.getClass()}"/>
  {:else}
    {#if block.viewParnum}
      <div class="bview-parnum">{block.viewParnum}</div>
    {/if}

    <div id="display-{block.blockid}" lang="{block.language}"
      class="bview-content part-0 {block.getClass ? block.getClass() : ''} hide-archive"
      data-parnum="{block.viewParnum}"
      data-type="{block.type}">
      {@html block.content}
    </div>

    {#if block.footnotes && block.footnotes.length > 0}
    <div class="footnotes">
      {#each block.footnotes as footnote, footnoteIdx (footnote)}
      <div class="{footnote.isShow ? '' : '-hidden'}">
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
  </div>-->
{:else}
  <div class="ilm-block ilm-display content-process-run preloader-loading"></div>
{/if}
<!--<div class="clearfix"></div>-->
</template>
<script>

  //import { fade } from 'svelte/transition';

  export let block;
  export let blockRid = '';
  export let mode = 'edit';
  export let isCompleted = false;

  let footNotes = {};

  /*let getRandomInt = (min, max)=>{
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }*/
  //let rand = getRandomInt(0, 200);

  const imgPropsDefault = {
    width: 200,
    height: 200,
    url: false
  }

  const getImgProps = (imgUrl = false) => {
    return new Promise((resolve, reject) => {
      if (!imgUrl) return resolve(imgPropsDefault);

      const img = new Image();

      img.onload = function() {
        resolve({
          width: this.width,
          height: this.height,
          url: imgUrl
        })
      };

      img.src = imgUrl;
      //return resolve({})

    })
  }

  const blockOutPaddings = () => {
    return (mode !== 'narrate' && block.classes && block.classes.hasOwnProperty('outsize-padding')) ? block.classes['outsize-padding'] : ''
  }

  const isSplittedBlock = () => {
//     if (this.block.voicework === 'narration' && !this.currentJobInfo.text_cleanup && Array.isArray(this.block.parts) && this.block.parts.length > 1 && !(this.currentJobInfo.mastering || this.currentJobInfo.mastering_complete)) {
//       return true;
//     }
    return false;
  }

  const blockParts = () => {
    if (!block) {
      return [{}];
    }
    if (isSplittedBlock()) {
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

  const getClass = () => {
    //return this.block.getClass(mode);
    return '';
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
  console.log(`getParnum: `, block.type, block.secnum, block.parnum, block.isNumber, block.isHidden);
    if (block.type == 'header' && block.isNumber && !block.isHidden) {
      return block.secnum;
    }
    else if (block.type == 'par' && block.isNumber && !block.isHidden) {
      return block.parnum;
    }
    else return '8.8';
  }

</script>

<style>

</style>
