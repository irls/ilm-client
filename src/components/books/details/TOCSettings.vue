<template>
  <div class="toc-settings-modal">
    <div class="modal-header">
      <h4>Name and Title generation pattern</h4>
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
            @onKeyup="settingValueChanged('name_pattern')"
            ref="name_pattern">
            
          </resizable-textarea>
        </div>
        <span v-ilm-tooltip.top="{value: 'This will generate Names based on your input<br>combined with block or section number', classList: {tooltip: 'white-tooltip'}}" class="field-tooltip-info">i</span>
        <div class="setting-buttons">
          <button v-for="(pattern_value, pattern_name) in patternCustomTypes.name_pattern"
            class="btn btn-default insert-toc-pattern" 
            v-on:click="addPattern('name_pattern', pattern_name)">
            {{pattern_value.title}}
          </button>
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
            @onKeyup="settingValueChanged('title_pattern')"
            ref="title_pattern">
              
          </resizable-textarea>
        </div>
        <span v-ilm-tooltip.top="{value: 'This will generate Titles based on your input<br>combined with block text', classList: {tooltip: 'white-tooltip'}}" class="field-tooltip-info">i</span>
        <div class="setting-buttons">
          <button v-for="(pattern_value, pattern_name) in patternCustomTypes.title_pattern" 
            class="btn btn-default insert-toc-pattern" 
            v-on:click="addPattern('title_pattern', pattern_name)">
            {{pattern_value.title}}
          </button>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-default" v-on:click="closeModal()">Cancel</button>
      <button class="btn btn-primary" v-on:click="saveChanges()" :disabled="applyDisabled">Apply</button>
    </div>
  </div>
</template>
<script>
  import ResizableTextarea from '../../generic/ResizableTextarea.vue';
  import { mapGetters, mapActions } from 'vuex';
  import Vue from 'vue';
  import IlmTooltip from '../../../directives/ilm-tooltip/ilm-tooltip.js';
  import '../../../directives/ilm-tooltip/ilm-tooltip.css';
  
  Vue.directive('ilm-tooltip', IlmTooltip);
  
  export default {
    data() {
      return {
        patternCustomTypes: {
          name_pattern: {
            block_number: {value: '[block #]', title: 'Block number'},
            section_number: {value: '[section #]', title: 'Section number'},
          },
          title_pattern: {
            block_number: {value: '[block #]', title: 'Block number'},
            section_header: {value: '[section_header]', title: 'Section header'},
            chapter_header: {value: '[chapter_header]', title: 'Chapter header'},
            subheader: {value: '[subheader]', title: 'Subheader'},
            sub_subheader: {value: '[sub_subheader]', title: 'Sub subheader'},
            paragraph: {value: '[paragraph]', title: 'Paragraph'},
          }
        },
        lastCursorPosition: {
          name_pattern: null,
          title_pattern: null
        },
        applyDisabled: true
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
        //console.log(field, event.target.value)
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
          let text = this.patternCustomTypes[field][type] ? this.patternCustomTypes[field][type].value : '';
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
          this.applyDisabled = false;
        }
      },
      saveChanges() {
        this.$emit('save', {
          namePattern: this.$refs.name_pattern.$el.value,
          titlePattern: this.$refs.title_pattern.$el.value,
        });
      },
      settingValueChanged(setting_name) {
        if (this.applyDisabled) {
          let ref = this.$refs[setting_name];
          if (ref && ref.$el) {
            let disabled = true;
            switch (setting_name) {
              case 'name_pattern':
                disabled = this.tocSectionBook.namePattern === ref.$el.value;
                break;
              case 'title_pattern':
                disabled = this.tocSectionBook.titlePattern === ref.$el.value;
                break;
            }
            this.applyDisabled = disabled;
          }
        }
      }
    }
  }
</script>
<style lang="less">
  .toc-settings-modal {
    height: auto;
    width: 420px;
    border: 1px solid #b9b6b6;
    position: absolute;
    background: white;
    left: 100%;
    margin-left: -440px;
    z-index: 999;
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
          border-radius: 4px;
          display: inline-block;
          width: 92%;
          textarea {
            resize: none;
          }
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
        .field-tooltip-info {
          border: 1.6px solid #337AB7;
          color: #337AB7;
          border-radius: 15px;
          padding: 1px 1px;
          cursor: pointer;
          width: 16px;
          height: 16px;
          text-align: center;
          display: inline-block;
          font-size: 10px;
          vertical-align: top;
          font-weight: 700;
          margin-top: 5px;
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