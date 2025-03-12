<template>
  <div class="suggestions-list-options">
    <div class="apply-suggestion">
      <button class="btn btn-primary" >Apply</button>
    </div>
    <div class="filter-suggestion">
      <div>
        <input type="text" v-model="filter" />
        <i v-if="filter.length > 0" class="ico ico-clear-filter btn-inside" v-on:click="clearFilter"></i>
      </div>
      <div>
        <button class="btn btn-primary" :disabled="!filter.length">
          <i class="fa fa-plus"></i>
        </button>
      </div>
    </div>
    <div v-if="canAddSuggestion" class="add-suggestion"></div>
    <div class="suggestions-list">
      <table>
        <tr v-for="suggestion in filteredSuggestions">
          <td :title="suggestion.text">
            {{ suggestion.text }}
          </td>
          <td :title="suggestion.suggestion">
            {{ suggestion.suggestion }}
            <div class="suggestion-options">
              <i class="fa fa-trash"></i>
              <i class="fa fa-pencil"></i>
            </div>
          </td>
        </tr>
      </table>
    </div>
  </div>
</template>
<script>
  export default {
    data() {
      return {
        filter: ''
      }
    },
    props: ['suggestions'],
    computed: {
      filteredSuggestions: {
        get() {
          if (!this.filter) {
            return this.suggestions;
          }
          let filter = this.filter.toLowerCase().trim();
          return this.suggestions.filter(suggestion => {
            return suggestion.text.toLowerCase().indexOf(filter) !== -1 || suggestion.suggestion.toLowerCase().indexOf(filter) !== -1;
          });
        },
        cache: false
      },
      canAddSuggestion: {
        get() {
          return this.filter.length > 0;
        },
        cache: false
      }
    },
    methods: {
      clearFilter() {
        this.filter = "";
      }
    }
  }
</script>
<style lang="less">
  @border-color: 2px solid #D9D9D9;
  .suggestions-list-options {
    .filter-suggestion {
      padding: 10px 3px;
      &>div {
        display: inline-block;
        &:first-child {
          width: 80%;
          input[type="text"] {
            width: 100%;
            height: 34px;
            border: 1px solid #D9D9D9;
            border-radius: 5px;
            &:focus {
              outline: 0;
            }
          }
          i {
            margin-left: -30px;
            margin-top: 6px;
            z-index: 999;
            position: absolute;
          }
        }
        button {
          i {
            color: white;
            font-weight: 200;
            font-size: 14px;
            border: 1px solid white;
            border-radius: 15px;
            padding: 5px;
            width: 26px;
            height: 26px;
          }
        }
      }
    }
    .suggestions-list  {
      padding: 10px 5px;
      margin: 5px 0px;
      border-top: @border-color;
      border-bottom: @border-color;
      table {
        width: 100%;
        tr {
          border: none;
          cursor: pointer;
          &:hover {
            background-color: #FFF8DC;
            .suggestion-options {
              display: inline-block;
            }
          }
          td {
            border: none;
            padding: 5px 7px;
            width: 50%;
            position: relative;
            text-overflow: ellipsis;
            white-space: nowrap;
            overflow: hidden;
            max-width: 210px;
            &:first-child {
              border-right: @border-color;
            }
            .suggestion-options {
              display: none;
              position: absolute;
              left: 75%;
              top: 20%;
              i {
                display: inline-block;
                padding: 0px 4px;
                &.fa-trash {
                  color: red;
                }
              }
            }
          }
        }
        tr:nth-child(odd) {
          background-color: #EFEFEF;
        }
      }
    }
  }
</style>