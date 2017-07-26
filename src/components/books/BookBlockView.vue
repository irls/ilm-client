<template>
<table class="block-content">
    <tr class="top">
        <!-- Editor toolbar, only visible for editors -->
        <td class="controls-top" colspan="3">
          <div class="controls-top-wrap" data-toggle="tooltip" v-bind:title="JSON.stringify(block)">
          <div class="-hidden">
              <i class="fa fa-trash-o fa-lg"></i>
              <i class="fa fa-pencil-square-o fa-lg"></i>
              <!-- Block Type selector -->
              <select v-model='block.type'>
                  <option v-for="(type, index) in blockTypes" :value="type">{{ type }}</option>
              </select>
              <!-- Block Class selector -->
              <select>
                <option v-for="(type, index) in blockTypeClasses.title" :value="type">{{ type }}</option>
              </select>
          </div>
          </div>
        </td>
    </tr><!--<tr class="top"-->

    <tr class="middle">

        <td class="controls-left">
        <div class="controls-left-wrap" v-bind:class="[block.type=='par' ? '-shifted' : '']">
            <!-- Show parnum only on paragraphs -->
            <template v-if="block.type=='par'">
              <div class="parnum">{{block.parnum ? block.parnum : ''}}</div>
              <div class="toggle-view -hidden">
                <i class="fa fa-eye-slash" v-if="block.parnum"></i>
                <i class="fa fa-eye" v-else ></i>
              </div>
            </template>
            <!-- add/remove paragraph controls -->
            <div class='par-ctrl -hidden'>
              <i class="fa fa-plus" aria-hidden="true"></i>
              <i class="fa fa-minus" aria-hidden="true"></i>
            </div>
        </div>
        </td><!--<td controls-left>-->

        <!-- Content -->
        <td class="content-center ocean">
            <div class="content-wrap content" v-html="block.content"
            v-bind:class="block.type"
            @input="input"
            @contextmenu.prevent="$refs.blockCntx.openMenu">
            </div>
            <!--<div class="content-wrap">-->
            <block-context-menu ref="blockCntx"
            :update="update"
            ></block-context-menu>
        </td>
        <!-- /Content -->

        <td class="controls-right"></td>


    </tr><!--<tr class="middle">-->

    <tr class="bottom">
        <td colspan="3"></td>
    </tr><!--<tr class="bottom"-->
</table>
</template>

<script>
import Vue from 'vue'
require('./vendor/medium-editor.min.js');
import BlockContextMenu from '../generic/BlockContextMenu'

export default {
  data () {
    return {
      blockTypes: ['title', 'header', 'subhead', 'par', 'illustration', 'aside', 'hr'],
      blockTypeClasses: {
          title: [' ', 'subtitle', 'author', 'translator'],
          header: [' ', 'chapter', 'selection', 'letter', 'talk', 'date', 'venue'],
          subhead: [' ', 'toc1', 'toc2', 'toc3', 'toc4'],
          par: [' ', 'dropcap', 'blockquote'],
          illustration: ['small', 'med', 'full'],
          aside: ['fn', 'inline'],
          hr: [' ', 'section', 'large', 'small']
      },
    }
  },
  components: {
      'block-context-menu': BlockContextMenu
  },
  props: ['block'],
  mounted: function() {
       let editor = new MediumEditor('.content-wrap');
  },
  methods: {
      update: function() {
          console.log('update');
          this.block.content += 'BBB';
      },
      input: function(el) {
           console.log('input', el.innerHTML());
           el.target.focus();
      }
  }
}
</script>

<style src='./css/medium-editor/medium-editor.min.css'></style>
<style src='./css/medium-editor/flat.min.css'></style>
<style lang='less' scoped>

@variable: 90px;

.ocean {
    padding: 0;
}

table.block-content {
    width: 100%;
}

tr.top {
    height: 32px;

    td {
        width: 100%;
    }

    .controls-top-wrap {
        margin-left: 50px;
    }

    .-hidden {
        display: none;
    }

    &:hover {
        .-hidden {
            display: block;
        }
    }
}

tr.middle {

    td {
        vertical-align: top;
    }

    td.controls-left {
        vertical-align: top;
        /*background: gray;*/
        .controls-left-wrap {
            width: 35px;
            height: 42px;
            padding: 0 5px;
            padding-top: 6px;

            &.-shifted {
                height: 78px;
                margin-top: -20px;
            }

            .-hidden {
                display: none;
            }

            &:hover {
                .-hidden {
                    display: block;
                }
            }
        }
        .parnum {
            height: 18px;
            margin-left: 2px;
        }
        .fa {
            margin-left: 3px;
        }
    }

    td.content-center {
        width: 100%;
        padding-right: 5px;
        position: relative;

        .content-wrap {
            padding: 6px 11px;

            &:hover {
                border: 1px solid silver;
                border-radius: 8px;
                padding: 5px 10px;
                background: rgba(219, 232, 255, .3);
            }
            &:focus {
                outline: none;
                border-radius: 8px;
                border-color: #9ecaed;
                box-shadow: 0 0 10px #9ecaed;
            }
        }
    }

    td.controls-right {
        background: blue;
        vertical-align: top;
    }
}

tr.bottom {
    display: none;
    width: 100%;
}

.fa {
    cursor: pointer;
    color: gray;
}

.fa:hover {
    color: #505050;
}

.par-ctrl {
    .fa-plus, .fa-minus {
        border: 1px solid silver;
        border-radius: 3px;
        cursor: pointer;
        width: 18px; height: 18px;
        padding: 0 0 0 1px;
        /*background: #F0FFF0;*/
    }
    .fa-plus:hover {
        border-color: darkgreen;
        color: darkgreen;
    }
    .fa-minus:hover {
        border-color: maroon;
        color: maroon;
    }
}

</style>
