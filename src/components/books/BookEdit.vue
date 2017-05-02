<template>
<table class='visual'>

  <tr v-for="(b, blid) in parlist" colspan="2">
    <!-- Paragraph number column -->
    <td class='num'>
      <div class='number'>      <!-- Because a td cannot force height -->

        <!-- Show parnum only on paragraphs -->
        <template v-if="b.type=='par'">
          <div @click='editBlockid(b)'>{{ b.parnum ? b.parnum : '' }}</div>
          <div class="togglebid">
            <i class="fa fa-eye-slash" v-if="b.parnum" @click='showParNum(b)'></i>
            <i class="fa fa-eye" v-else @click='hideParNum(b)'></i>
          </div>
        </template>

        <!-- add/remove paragraph controls -->
        <div class='parctrl'>
          <i class="fa fa-plus" aria-hidden="true" @click='insertBlockBelow(b)'></i>
          <i class="fa fa-minus" aria-hidden="true" @click='removeBlock(b)'></i>
        </div>
      </div>
    </td>
    <td class='content'>
      <BlockView v-if='!isEditing' :block="b" :blid="blid" />
      <!-- <BlockEdit v-else /> -->
    </td>
  </tr>
  <infinite-loading :on-infinite="onInfiniteScroll" ref="infiniteLoading"></infinite-loading>

</table>
</template>

<script>
import ContextMenu from '../generic/ContextMenu'
import BlockView from './BlockView'
import InfiniteLoading from 'vue-infinite-loading'

export default {
  data () {
    return {
      data: '',
      isEditing: false,
      book: this.$store.state.currentBook,
      meta: this.$store.state.currentBookMeta,
      parlist: [],
    }
  },
  components: {
    ContextMenu, BlockView, InfiniteLoading
  },
  methods: {
    onInfiniteScroll() {
      let index = this.parlist.length
      let step = 3 // number of paragaphs to grab at a time
      this.parlist = this.parlist.concat(this.book.content.slice(index, index+step));
      this.$refs.infiniteLoading.$emit('$InfiniteLoading:loaded');
    },
    hasClass: function(block, cssclass) {
      let list = block.classes.toLowerCase().trim().split(' ');
      return (list.indexOf(cssclass.toLowerCase()) > -1)
    },
    showID: function(block) {
      return ((block.type==='par') && this.hasClass(block, 'parnum'))
    },
    renumberPar(block, newNum) {

    },
    renumberPars(from, startnum) {

    },
    toggleIDvisibility(block) {
      if (!block.type=="par") return; // this should only apply to par types
      if (this.showID(block)) {
        // append _ to id, user can edit later if this is not sufficent
        // if X.y format, loop through folowing blocks with same X and decrement y
           // else, loop through all remaining blocks and decrement
      } else {
        // remove _ to make block numeric
        // if

      }
    },
    hideParNum: function(block) {
      alert('Removing Paragraph Number'+ block.id)
    },
    showParNum: function(block) {
      alert('Adding Paragraph Number'+ block.id)
    },
    insertBlockBelow: function (block) {
      alert('Inserting new Block after '+block.id)
    },
    removeBlock: function(block) {
      alert('Merging block into '+block.id)
    },
    editBlockid: function(block) {
      alert('Editing block id '+block.id)
    },






  },
  computed: {
    // currentBook: function() {
    //   this.book = this.$store.state.currentBook
    //   console.log(this.book)
    //   return this.book
    // },
    currentBookContentBlocks: function() {
      //console.log("currentBookContentBlocks", this.currentBook)
      //this.book = this.$store.state.currentBook
      if (this.book && this.book.content) {
        //console.log(this.book.content_blocks)
        return this.book.content
      }
      else return []
    }
  },
  // beforeCreate: function() {
  //   this.componentState = 'beforeCreate'
  // },
  // created: function() {
  //   this.componentState = 'created'
  // },
  // beforeMount: function() {
  //   this.componentState = 'beforeMount'
  // },
  // mounted: function() {
  //   this.componentState = 'mounted'
  // },

}
</script>


<style>
.visual {display: table; width: 100%;  }
.visual tr {vertical-align: top; }
/*numbering*/
.visual td.num{
  min-width: 1.5em; padding-top: 1em; position: relative;
  min-height: 200px;  display: table-cell;
}
/*Content*/
.visual td.content {width: 100%; padding: 0;
  vertical-align: top;
  /*border: 1px solid green;*/
}

/*Block Numbering */
.number {min-height: 3em; display: block;
  padding-right: .5em; padding-left: 3px; margin-top: 1em;
}
.number.greyed {color: silver; font-style: italic; font-size: .75em;}

/*eye button*/
div.togglebid {
  margin-left:0; margin-top:-.25em; color: rgba(83, 114, 86, 1);
  display: none;
}
.togglebid:hover { cursor:pointer;}
.togglebid.greyed {color: rgba(150, 73, 55, .5);}

/*.togglebid:hover */

.parctrl {position: absolute; bottom: 20px;
   display: none;
}
.parctrl i {
   font-size: .75em;
   padding:0; margin:0; background: white; width: .75em; height: .75em;
   display: block; color: gray;
  border: 1px solid silver;
   border-radius: 3px;
   padding: 2px; padding-right: 11px; padding-bottom:10px;
   margin-left: 1px; margin-top: 2px;
}
.parctrl i:hover {
  color: darkgreen; background: #F0FFF0; border: 1px solid darkgreen;
  cursor: pointer;
}
.parctrl i.fa-minus:hover { color: maroon; background: pink; border: 1px solid maroon}

td.num:hover > .number .parctrl{ display: block; }
td.num:hover > .number .togglebid {display: block;}

td.num:hover > td.content table.viewer td.viewercontent div.content  {
  background: rgba(219, 232, 255, .3);
  border: .25px solid rgba(219, 232, 255, 1);
  border-radius: .25em;
}


</style>
