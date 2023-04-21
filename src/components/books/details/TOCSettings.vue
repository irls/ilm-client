<template>
  <div class="toc-settings-modal">
    <div class="modal-header">
      <h4>Edit section meta</h4>
      <button class="close" v-on:click="closeModal">
        <i class=""></i>
      </button>
    </div>
    <div class="modal-body">
      <div class="setting-row">
        <div class="setting-title">
          <label>Name</label>
        </div>
        <div class="setting-field">
          <resizable-textarea
            :initValue="tocSectionBook.namePattern"
            @valueChanged="onInputPattern('name_pattern', $event)"
            @onBlur="onBlurPattern('name_pattern', $event)"
            ref="name_pattern">
            
          </resizable-textarea>
        </div>
        <div class="setting-buttons">
          <button class="btn btn-default insert-toc-pattern" v-on:click="addPattern('name_pattern', 'block_number')">Block number</button>
          <button class="btn btn-default insert-toc-pattern" v-on:click="addPattern('name_pattern', 'section_number')">Section number</button>
        </div>
      </div>
      <div class="setting-row">
        <div class="setting-title">
          <label>Title</label>
        </div>
        <div class="setting-field">
          <resizable-textarea
            :initValue="tocSectionBook.titlePattern"
            @valueChanged="onInputPattern('title_pattern', $event)"
            @onBlur="onBlurPattern('title_pattern', $event)"
            ref="title_pattern">
              
          </resizable-textarea>
        </div>
        <div class="setting-buttons">
          <button class="btn btn-default insert-toc-pattern" v-on:click="addPattern('title_pattern', 'block_number')">Block number</button>
          <button class="btn btn-default insert-toc-pattern" v-on:click="addPattern('title_pattern', 'section_header')">Section header</button>
          <button class="btn btn-default insert-toc-pattern" v-on:click="addPattern('title_pattern', 'chapter_header')">Chapter header</button>
          <button class="btn btn-default insert-toc-pattern" v-on:click="addPattern('title_pattern', 'subheader')">Subheader</button>
          <button class="btn btn-default insert-toc-pattern" v-on:click="addPattern('title_pattern', 'sub_subheader')">Sub subheader</button>
          <button class="btn btn-default insert-toc-pattern" v-on:click="addPattern('title_pattern', 'paragraph')">Paragraph</button>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-default" v-on:click="closeModal()">Cancel</button>
      <button class="btn btn-primary" v-on:click="saveChanges()">Apply</button>
    </div>
  </div>
</template>
<script>
  import ResizableTextarea from '../../generic/ResizableTextarea.vue';
  import { mapGetters, mapActions } from 'vuex';
  export default {
    data() {
      return {
        patternCustomTypes: {
          block_number: '[block #]',
          section_number: '[section #]',
          section_header: '[section_header]',
          chapter_header: '[chapter_header]',
          subheader: '[subheader]',
          sub_subheader: '[sub_subheader]',
          paragraph: '[paragraph]',
        },
        lastCursorPosition: {
          name_pattern: null,
          title_pattern: null
        }
      }
    },
    components: {
      ResizableTextarea
    },
    computed: {
      ...mapGetters('tocSections', ['tocSectionBook'])
    },
    methods: {
      closeModal() {
        this.$emit('close');
      },
      onInputPattern(field, event) {
        console.log(field, event.target.value)
      },
      onBlurPattern(field, event) {
        //console.log('onBlurPattern', event.relatedTarget.classList, event.target.selectionStart);
        let position = event && event.target && event.target.selectionStart >= 0 ? event.target.selectionStart : null;
        if (event && event.relatedTarget && event.relatedTarget.classList) {
          if (event.relatedTarget.classList.contains('insert-toc-pattern')) {
            //console.log('set', field, position)
            this.lastCursorPosition[field] = position;
          }
        } else {
          this.lastCursorPosition[field] = null;
        }
      },
      addPattern(field, type) {
        let fieldRef = this.$refs[field];
        if (fieldRef) {
          let text = this.patternCustomTypes[type] || '';
          if (this.lastCursorPosition[field] === null) {
            fieldRef.$el.value+= text;
          } else {
            let currentValue = fieldRef.$el.value;
            fieldRef.$el.value = currentValue.substring(0, this.lastCursorPosition[field]) + text + currentValue.substring(this.lastCursorPosition[field]);
            fieldRef.$el.focus();
            fieldRef.$el.selectionStart = this.lastCursorPosition[field] + text.length;
            fieldRef.$el.selectionEnd = fieldRef.$el.selectionStart;
          }
          fieldRef.$el.dispatchEvent(new Event('input'));
        }
      },
      saveChanges() {
        this.$emit('save', {
          namePattern: this.$refs.name_pattern.$el.value,
          titlePattern: this.$refs.title_pattern.$el.value,
        });
      }
    }
  }
</script>
<style lang="less">
  .toc-settings-modal {
    height: auto;
    width: 100%;
    border: 1px solid #b9b6b6;
    position: absolute;
    background: white;
    left: 0px;
    .modal-header {
      padding: 10px 15px;
      border-bottom: none;
      h4 {
        margin: 0px;
        font-size: 16px;
        font-weight: 700;
      }
      .close {
        float: right;
        margin-top: -24px;
        margin-right: 0px;
        i {
          &::before {
            content: "\D7"
          }
        }
      }
    }
    .modal-body {
      .setting-row {
        .setting-title {
          label {
            font-size: 14px;
            font-weight: 400;
          }
        }
        .setting-field {
          border: 1px solid #b9b6b6;
        }
        .setting-buttons {
          margin: 5px 0px 5px -5px;
          button {
            height: 26px;
            background: rgba(217, 217, 217, 0.2);
            border: 1px solid rgba(0, 0, 0, 0.2);
            border-radius: 4px;
            font-size: 14px;
            margin: 5px;
            padding: 2px 10px;
          }
        }
      }
    }
    .modal-footer {
      button {
        height: 34px;
        font-size: 14px;
      }
    }
  }
</style>