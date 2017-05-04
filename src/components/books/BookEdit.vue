<template>
<div id="editviewarea" :class="{scrollable: showScrollbar}">

  <div class="savechanges" v-if="edited.length">
    <button class="btn btn-default save" @click="saveChanges">
      <i class="fa fa-floppy-o" aria-hidden="true"></i> &nbsp; Save Changes
    </button>
    <button class="btn btn-default discard" @click="discardChanges">
      <i class="fa fa-ban" aria-hidden="true"></i> &nbsp; Discard {{edited.length}} Changes
    </button>
  </div>

  <table class='visual'>

  <tr v-for="(block, blid) in parlist" colspan="2">
    <!-- Paragraph number column -->
    <td class='num'>
      <div class='number'>  <!-- Because a td cannot force height -->

        <!-- Show parnum only on paragraphs -->
        <template v-if="block.type=='par'">
          <div @click='editBlockid(block)'>{{ block.parnum ? block.parnum : '' }}</div>
          <div class="togglebid">
            <i class="fa fa-eye-slash" v-if="block.parnum" @click='showParNum(block)'></i>
            <i class="fa fa-eye" v-else @click='hideParNum(block)'></i>
          </div>
        </template>

        <!-- add/remove paragraph controls -->
        <div class='parctrl'>
          <i class="fa fa-plus" aria-hidden="true" @click='insertBlockBelow(block)'></i>
          <i class="fa fa-minus" aria-hidden="true" @click='removeBlock(block)'></i>
        </div>

      </div>
    </td>
    <td class='content'>
      <BlockView v-if='!isEditing' :block="block" :blid="blid" @edited="blockEdit(blid, $event)" />
      <!-- <BlockEdit v-else /> -->
    </td>
  </tr>
  <infinite-loading v-if="autoload" :on-infinite="onInfiniteScroll" ref="infiniteLoading"></infinite-loading>

</table>
</div>
</template>

<script>
import ContextMenu from '../generic/ContextMenu'
import BlockView from './BlockView'
import InfiniteLoading from 'vue-infinite-loading'
import Vue from 'vue'
import access from "../../mixins/access.js"
import PouchDB from 'pouchdb'

export default {
  data () {
    return {
      data: '',
      isEditing: false,
      book: this.$store.state.currentBook,
      meta: this.$store.state.currentBookMeta,
      parlist: [],
      edited: [], // list of edits
      autoload: true,
      showScrollbar: false
    }
  },
  mixins: [access],
  components: {
    ContextMenu, BlockView, InfiniteLoading
  },
  methods: {
    onInfiniteScroll() {
      var vm = this
      let loadCount = vm.loadBlocks(50)
      if (loadCount>0) {
        vm.autoLoadBlocks();
        this.$refs.infiniteLoading.$emit('$InfiniteLoading:loaded');
      } else {
        this.$refs.infiniteLoading.$emit('$InfiniteLoading:complete');
      }
    },
    autoLoadBlocks: function() {
      var vm = this
      setTimeout(function(){
        let loadCount = vm.loadBlocks(100)
        if (loadCount>0) {
          //console.log("  ...added "+loadCount+" blocks...")
          vm.autoLoadBlocks();
        } else {
          //console.log('Finished loading blocks') // show scrollbars here
          //vm.showScrollbar= true
        }
      }, 1)
    },

    loadBlocks: function(step) {
      let index = this.parlist.length
      let tmp = []
      for (let i = index; i < index + step; i++) if (i<this.book.content.length) {
        let newBlock = Object.assign({}, this.book.content[i])
        newBlock.edited = false
        newBlock._deleted = false
        tmp.push(newBlock)
      }
      if (tmp.length>0) {
        this.parlist = this.parlist.concat(tmp);
        return tmp.length;
      } else return 0
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
    saveChanges: function() {
      // how do we insert new blocks?
      var vm = this
      var book = vm.$store.state.currentBook
      this.parlist.forEach((block, blid) => {
        if (block.edited) {
          // console.log("Replacing edited block #"+blid)
          delete block.edited
          book.content[blid] = Object.assign({}, block)
        }
      })

      // delete deleted blocks
      book.content = book.content.filter(function(block, blid) {
        //if (block._deleted) console.log('Deleting block #', blid)
        return !block._deleted
      })
      // split splitted blocks

      // save to DB
      vm.autoload = false
      var db = this.libraryDB() // gets authenticated instance of ilm_library db
      db.get(book._id).then(function(doc){
        doc.content = book.content // does this create a copy or a reference?
        db.put(doc).then(doc => {
          db.get(doc.id).then(newdoc => {
            vm.book = newdoc
            vm.reloadBookDisplay(vm)
            vm.edited = [];
            //console.log('emptied edited list: ', this.edited)
          })
        }).catch(err => console.log(err))
      })

    },
    reloadBookDisplay: function(vm) {   // reload book?
      var currentLoaded = this.parlist.length
      var position = document.getElementById('editviewarea').scrollTop
      vm.parlist = [] // why is this not working??
      for (let i=0; i<currentLoaded; i++) {
        var obj = Object.assign({}, this.book.content[i])
        obj.edited = false
        obj._deleted = false
        vm.parlist.push(obj)
      }
      document.getElementById('editviewarea').scrollTop = position
      vm.autoload = true
    },
    discardChanges: function() {
      console.log('Discarding Changes...')
      var vm = this
      this.parlist.forEach(function(item, i) {
        if (item.edited) {
          let newObj = Object.assign({}, vm.book.content[i])
          newObj.edited = false
          newObj._deleted = false
          // Vue.set(vm.parlist, i, newObj)
          vm.parlist[i] = newObj
          console.log("Replaced block "+i, newObj)
        }
      })
      this.edited = [];
      //console.log('emptied edited list: ', this.edited)
    },
    blockEdit: function (blid, block) {
      this.edited = [...new Set(this.edited)] // es6 way of _uniq
      if (block.edited) this.edited.push(blid)
       else this.edited = this.edited.filter(item => item!=blid)
      this.edited = [...new Set(this.edited)]
      Vue.set(this.parlist, blid, block);
      // console.log(this.parlist[blid], block)
      // console.log(this.parlist[blid]===block ? "blocks match": "blocks don't match")
      // console.log(this.edited)
    }

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

#editviewarea {position: relative;}
.savechanges {position: fixed; z-index: 1000; left: 1em; bottom:1em;}
.savechanges button.save {box-shadow: 1px 1px 5px 3px rgba(0,150,0,0.5);}
.savechanges button.discard {box-shadow: 1px 1px 5px 3px rgba(150,0,21,0.5); margin-left: 1em}

.scrollable {
  overflow-y: auto;
}

</style>
