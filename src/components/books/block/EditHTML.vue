<template>
  <!-- <div>
    CHECK MODAL HERE
  </div> -->
  <div v-on:wheel.stop="" :class="['-langblock-' + blockLang, 'block-html-modal']">
    <div class="modal-header">
      <div>
        <h4 class="modal-title">{{editBlockHTMLLabel}}</h4>
      </div>
      <button type="button" class="close modal-close-button" aria-label="Close" @click="close()">
        <span aria-hidden="true">×</span>
      </button>
    </div>
    <div class="modal-body">
      <TabView ref="htmlContentTabs" :scrollable="true" v-on:tab-change="onBlockHTMLTabChange">
        <TabPanel :header="parnumCompNotHidden || '0'">
          <div class="modal-title-wrapper">
            <h4>Block ID:&nbsp;{{shortBlockid}}; &nbsp;&nbsp;&nbsp;wordsRange:&nbsp;{{wordsRange}};</h4>
            <h4 v-if="block.audiosrc">
              Download: <a v-if="audioUrl" :href="audioUrl" target="_blank">flac</a>&nbsp;&nbsp;<a v-if="compressedAudioUrl" :href="compressedAudioUrl" target="_blank">m4a</a>
            </h4>
          </div>
          <div class="block-content-update-pending">
            <span v-if="hasPendingContentChanges" class="block-content-update-pending">Block has not been updated yet with pending approval sub-block changes.</span>
          </div>
          <div class="block-html-header">{{blockHtmlHeader}}</div>
          <codemirror
            :ref="'block-html' + block.blockid"
            :options="getCodeMirrorOptions()"
            :class="[{'-disabled': disabled}]"
          />
          <div class="block-html-header">&lt;/div&gt;</div>
        </TabPanel>
        <template v-if="block.getIsSplittedBlock()">
          <TabPanel v-for="(blockPart, blockPartIdx) in blockParts" :header="(subBlockParnumComp ? subBlockParnumComp + '_' : '') + (blockPartIdx + 1)" v-bind:key="'part-' + blockPartIdx + '-html-content'">
            <codemirror
              :ref="'block-part-' + blockPartIdx + '-html'"
              :options="getCodeMirrorOptions(blockPartIdx)"
              :class="[{'-disabled': !adminOrLibrarian}]"
            />
          </TabPanel>
        </template>
      </TabView>
    </div>
    <div class="modal-footer">
      <textarea class="copy-block-html-content" ref="copy-block-html-content"></textarea>
      <button class="btn btn-primary copy-block-html" v-on:click="copyBlockHtml()">Copy</button>
      <button class="btn btn-default" v-on:click="close()">
        <template v-if="adminOrLibrarian">Cancel</template>
        <template v-else>Close</template>
      </button>
      <button class="btn btn-primary" v-on:click="setPartsHtml()" v-if="adminOrLibrarian">Save</button>
    </div>
  </div>
</template>
<script>
  import TabView from 'primevue/tabview';
  import TabPanel from 'primevue/tabpanel';
  import { codemirror } from 'vue-codemirror';
  
  import('codemirror/lib/codemirror.css');
  import('codemirror/mode/xml/xml.js');
  import('codemirror/theme/base16-light.css');
  export default {
    props: ['blockLang', 'editBlockHTMLLabel', 'parnumCompNotHidden', 'shortBlockid', 'wordsRange', 'block', 'audioUrl', 'compressedAudioUrl', 'hasPendingContentChanges', 'blockHtmlHeader', 'disabled', 'adminOrLibrarian'],
    components: {
      'TabView': TabView,
      'TabPanel': TabPanel,
      'codemirror': codemirror
    },
    mounted() {
      console.log('MOUNTED HTML HERE');
      this.setHtml();
    },
    methods: {
      getCodeMirrorOptions(partIdx = null) {
        let cmOptions = {
          mode: 'text/html',
          //mode: 'text/x-ceylon',
          theme: 'base16-light',
          lineWrapping: true,
          readOnly: !this.adminOrLibrarian || (this.block.getIsSplittedBlock() && partIdx === null),
          //direction: ['ar', 'fa'].indexOf(this.getBlockLang) === -1 ? 'ltr' : 'rtl',
          //pollInterval: 50
          //htmlMode: true,
          specialChars: /[\u0000-\u001f\u007f-\u009f\u00ad\u061c\u200b-\u200f\u2028\u2029\ufeff\ufff9-\ufffc\=]/,
          specialCharPlaceholder: (char) => {
            let el = document.createElement('span');
            el.classList.add('cm-operator');
            if (char === '=') {
              el.innerHTML = `=`;
            }
            return el;
          },
          maxHighlightLength: Infinity
        };
        //cmOptions.rtlMoveVisually = cmOptions.direction === 'rtl';
        return cmOptions;
      },
      setHtml() {
        let content = this.block.content || "";
        if (!this.block.getIsSplittedBlock() && this.isChanged) {
          content = this.$refs.blocks[0].$refs.blockContent.innerHTML;
        }
        //content = content.replace(/<f[^>]+?>([\s\S]*?)<\/f>/img, '$1');

        this.$refs['block-html' + this.block.blockid].codemirror.doc.setValue(content);
        if (this.block.getIsSplittedBlock()) {
          this.block.parts.forEach((p, pIdx) => {
            let ref = this.$refs.blocks.find(r => {
              return r.blockPartIdx === pIdx;
            });
            if (ref) {
              content = p.isChanged ? ref.$refs.blockContent.innerHTML : p.content;
              this.$refs[`block-part-${pIdx}-html`][0].codemirror.doc.setValue(content/*.replace(/<f[^>]+?>([\s\S]*?)<\/f>/img, '$1')*/);
            }
          });
        }
        if (!this.block.getIsSplittedBlock()) {
          $(`.block-html-modal .p-tabview-nav-content`).hide();
        }
      },
      onBlockHTMLTabChange(ev) {
        if (ev.index === 0) {
          $(`#${this.block.blockid} .copy-block-html`).show();
        } else {
          $(`#${this.block.blockid} .copy-block-html`).hide();
        }
        if (ev.index > 0) {
          Vue.nextTick(() => {
            //this.$refs['block-part-' + (index - 1) + '-html'][0].codemirror.doc.setValue('<span>go-Doc-Start</span>');
            //this.$refs['block-part-' + (index - 1) + '-html'][0].codemirror.doc.changeGeneration(true);
            this.$refs['block-part-' + (ev.index - 1) + '-html'][0].codemirror.focus();
            this.$refs['block-part-' + (ev.index - 1) + '-html'][0].codemirror.execCommand('goDocStart');
            //console.log(this.$refs['block-part-' + (index - 1) + '-html'][0].codemirror);
          });
        }
      },
      close() {
        this.$emit('close');
      },
      setPartsHtml() {
        
      }
    }
  }
</script>
<style lang="less">
  .block-html-modal {
    .modal-header {
      width: 100%;
      .modal-close-button {
        float: right;
        width: 5%;
      }
    }
    .modal-body {
      overflow: visible;
      .CodeMirror-rtl, .CodeMirror-rtl * {
        /*direction: rtl; */
        text-align: right;
      }
      .block-content-update-pending {
        display: block;
        color: red;
        font-weight: bold;
        float: left;
        width: 100%;
        margin: 5px 0px;
      }
      .cm-tag, .cm-attribute, .cm-string, .cm-operator {
        color: #bfbfbf;
      }
      .vue-codemirror {
        &.-disabled {
          .CodeMirror-wrap {
            background-color: #f5f5f5;
          }
        }
        .CodeMirror-wrap {
          background-color: white;
          border: 1px solid gray;
        }
        /** {
          color: #dfdfdf;
        }*/
        /*.CodeMirror-code {
          * {
            color: gray;
          }
        }*/
      }
    }
    .modal-footer {
      .copy-block-html {
        float: left;
      }
      .copy-block-html-content {
        /*display: none;*/
        height: 0px;
        width: 0px;
        resize: none;
        padding: 0px;
        border-color: transparent;
        float: left;
      }
    }
    textarea.block-html {
      width: 100%;
      height: 330px;
      resize: none;/*vertical*/
      direction: ltr;
    }
    .modal-title {
      float: left;
      margin-left: 15px;
      width: 80%;
    }
    div.modal-title-wrapper {
      display: inline-block;
      width: auto;
      white-space: nowrap;
      h4, span {
        display: inline-block;
        font-size: 15px;
        margin-right: 10px;
      }
    }
    .p-tabview-nav-container {
      .p-tabview-nav {
        li {
          .p-tabview-nav-link {
            font-size: 1.2em;
            /*&:first-child {
              font-weight: bolder;
            }*/
              border: solid #dee2e6;
              border-top-color: rgb(222, 226, 230);
              border-top-width: medium;
              border-right-color: rgb(222, 226, 230);
              border-right-width: medium;
              border-bottom-color: rgb(222, 226, 230);
              border-bottom-width: medium;
              border-left-color: rgb(222, 226, 230);
              border-left-width: medium;
              border-width: 0 0 2px 0;
              border-color: transparent transparent #dee2e6 transparent;
              background: #ffffff;
              color: #6c757d;
              padding: 1.25rem;
              font-weight: 700;
              border-top-right-radius: 6px;
              border-top-left-radius: 6px;
              transition: box-shadow 0.2s;
              margin: 0 0 -2px 0;
          }
          &:first-child {
            .p-tabview-nav-link {
              font-weight: bolder;
              font-size: 1.5em;
            }
          }
        }
      }
    }

    .tab-pane {
      /*div {
        margin: 15px 0px 5px 0px;
      }*/
      .CodeMirror-wrap {
        height: 430px;
      }
      &:first-child {
        textarea {
          height: 350px;
        }
        .CodeMirror-wrap {
          height: 350px;
        }
      }
    }
    .block-html-header {
      margin: 10px 0px;
    }
    .scrtabs-tab-scroll-arrow {
      border: none;
    }
  }
</style>