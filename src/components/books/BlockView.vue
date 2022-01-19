<template>
  <table class='viewer'><tr colspan="2">

    <!-- if block is deleted, just show an undelete button -->
    <td v-if="deleted">
      <div>
        <button class="btn btn-default undeletebutton" @click="unDeleteBlock()">
          <i class="fa fa-trash" aria-hidden="true"></i>
          <i class="fa fa-undo" aria-hidden="true"></i> &nbsp; Undo Delete
        </button>
      </div>
    </td>
    <!-- Paragraph content Column -->
    <td class='viewercontent ilm-block' v-else>

      <!-- Editor toolbar, only visible for editors -->
      <div class='blockinfo'><div class='blockinfo-content'>

        <template v-show="isAdmin || isEditor || isLibrarian" v-if="!isEditing">

        <div class='edit_buttons' v-if="isShowEdit">
          <i class="fa fa-trash-o fa-lg deletebutton" @click='deleteBlock()'></i>&nbsp;
          <i class="fa fa-pencil-square-o fa-lg editbutton" @click='showEditor()'></i>
        </div>

        <div class='type'>

          <!-- Block Type selector -->
          <select v-model='block.type' v-if="isShowEdit">
            <option v-for="(type, index) in blockTypes" :value="type">{{ type }}</option>
          </select>

          &nbsp; &nbsp;
          <a href="" v-if="isShowEdit">Title <i class="fa fa-sort-desc" aria-hidden="true"></i></a>

          <select @select="addCss('title', $event)" v-if="isShowEdit">
            <option v-for="(type, index) in blockTypeClasses.title" :value="type">{{ type }}</option>
          </select>
          <!-- All block classes -->
          <span v-for='classType of Object.keys(blockClasses)' class='menulink'>
          </span>
        </div>
        </template>

        <div class='classes' v-if='cleanClasses().length>0'><i>{{ cleanClasses() }}</i></div>

      </div></div>
      <!-- <div class='blockinfo'><div class='blockinfo-content'>-->
      <strong class="fix-message" v-html="subtask.comment"></strong>
      <div class='clearfix'></div>

      <!-- Content -->
      <template v-if="isEditing" v-on:keyup.esc="hideEditor()">
        <div class="wysiwygeditor_wrapper">
        <trumbowyg :content="block.content" svgPath="/static/icons.svg" @tbwchange="editedContent" class="wysiwygeditor" v-on:keyup.esc="hideEditor()"></trumbowyg></div>
      </template>
      <template v-else>
        <hr v-if="block.type==='hr'" :class="displayClasses()" :id="block.id"/>
        <div v-else :class="displayClasses()" v-html='block.content' :id="block.id"></div>
      </template>


    </td>

    <!-- Editing, Proofing and Recording Tools -->
    <td class='editing' v-show="!deleted && block.type!='hr'">

<template v-show="isAdmin || isReader" v-if='!isEditing'>
      <!-- audio play and record -->
      <div class="tools audio">
        <i class="fa fa-play-circle-o fa-lg" @click='clickEvent(b)' v-if='!isPlaying'></i>
        <i class="fa fa-pause-circle-o fa-lg" @click='clickEvent(b)' v-if='isPlaying'></i>
        <i class="fa fa-microphone fa-lg" @click='clickEvent(b)' v-if='!isRecording'></i>
        <i class="fa fa-stop-circle-o fa-lg" @click='clickEvent(b)' v-if='isRecording'></i>
        <!-- <i class="fa fa-remove" v-if="isShowRejectBlockAction" v-on:click="showRejectContentModal = true" title="Reject content"></i>
        <i class="fa fa-check" v-if="isShowCorrectBlockAction" v-on:click="fixBlockContent()" title="Content fixed"></i>
        <i class="fa fa-check" v-if="isShowApproveContentFixAction" v-on:click="fixBlockContent()" title="Content fix approved"></i> -->
      </div>
</template>

<template v-show="isAdmin || isEditor || isLibrarian" v-if='!isEditing'>
      <!-- editor approve and comment -->
      <div class="tools editor">
        <i class="fa fa-thumbs-o-up fa-lg" @click='clickEvent(b)'></i>
        <i class="fa fa-comment-o fa-lg" @click='clickEvent(b)'></i>
      </div>
</template>
<modal :show.sync="showRejectContentModal" effect="fade" ok-text="Reject" cancel-text="Cancel" title="Reject block content" @ok="rejectBlockContent()">
  <textarea v-model="rejectBlockContentMessage" class="reject-block-message"></textarea>
</modal>

    </td>

  </tr></table>
</template>


<script>
import dropdown from 'vue-my-dropdown'
import access from "../../mixins/access.js"
import Vue from 'vue'
import jQuery from 'jquery'
import VueEvents from 'vue-events'
import { modal } from 'vue-strap'
import axios from 'axios'
import api_config from '../../mixins/api_config.js'


export default {
  data () {
    return {
      visible: false,
      deleted: false,
      modified: false,
      // currentEditingBlockId: this.$store.state.currentEditingBlockId,
      blockType: '',
      blockTypes: ['title', 'header', 'subhead', 'par', 'illustration', 'aside', 'hr'],
      //blockTypes: '',
      blockTypeClasses: {
        title: [' ', 'subtitle', 'author', 'translator'],
        header: [' ', 'chapter', 'selection', 'letter', 'talk', 'date', 'venue'],
        subhead: [' ', 'toc1', 'toc2', 'toc3', 'toc4'],
        par: [' ', 'dropcap', 'blockquote'],
        illustration: ['small', 'med', 'full'],
        aside: ['fn', 'inline'],
        hr: [' ', 'section', 'large', 'small']
      },
      classStyles: ['Author','Justify','Whitespace','Textstyle','Padding','Format','Size','Font'],
      currentClasses: {
        Author: '',
        Justify: '',
        Whitespace: '',
        Textstyle: '',
        Padding: '',
        Format: '',
        Size: '',
        Font: ''
      },
      typeClasses: [' ', 'subtitle', 'author', 'translator'], // classes available for this type
      blockClasses: {
        Author: [' ', 'bab', 'baha', 'shoghi', 'sacred', 'bible', 'muhammad', 'quran', 'jesus', 'ali', 'tradition', 'husayn'],
        Justify: [' ', 'center', 'right', 'left'],
        Whitespace: [' ', 'verse', 'pre'],
        Textstyle: [' ', 'allcaps', 'smallcaps', 'italic', 'bold', 'underline', 'rulebelow', 'bookgraphic'],
        Padding: ['nopad', 'nopad-top', 'nopad-bottom', 'pad', 'pad-top', 'pad-bottom'],
        Format: ['blockquote', 'sitalcent', 'editor-note', 'question', 'signature', 'reference', 'preamble', 'prayer'],
        Size: ['xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large'],
        Font: [' ', 'typewriter', 'oldbook', 'modern']
      },
      isRecording: false,
      isPlaying: false,
      isEditing: false,
      editorOptions: {},
      showRejectContentModal: false,
      rejectBlockContentMessage: ''
    }
  },
  props: ['block', 'blockId', 'isShowRejectBlockAction', 'isShowCorrectBlockAction', 'isShowEdit', 'mainTaskId', 'subtask', 'isShowApproveContentFixAction'],
  components: {
    dropdown, modal
  },
  mixins: [access, api_config],
  methods: {
    getSelectedClasses: function(classes) {
      var selected = {Author: '', Justify: '', Whitespace: '',
        Textstyle: '',
        Padding: '',
        Format: '',
        Size: '',
        Font: ''
      }

    },
    selectedToClasses: function(selected) {

    },
    // block_tag: function(type) {
    //   return 'p'
    // },

    // textSelected: function(event) {
    //   //console.log( event)
    // },
    // clickEvent: function (block) {
    //
    // },
    // getSelectedTypeClass: function(type) {
    //
    // },
    // getTypeClasses: function(type) {
    //   if (this.blockTypeClasses.hasOwnProperty(type)) return this.blockTypeClasses[type];
    // },
    // setTypeClass: function(type, clss) {
    //   // remove type classes besides this one
    //   // add this one
    // },
    addCss: function(title, val){
      console.log('Adding CSS', title, val)

    },

    cssList: function(classes){
      if (Array.isArray(classes)) classes = classes.join(' ')
      let list = classes.trim().toLowerCase().split(' ').filter(item => item.trim().length>0)
      return [...new Set(list)] // es6 way of _uniq
    },
    cleanClasses: function(){
      var vm = this
      var classes = this.block.classes
      classes = classes.join(' ').trim().toLowerCase().split(' ').filter(item => {
        item.trim().length>0 && (vm.blockTypes.indexOf(item)<0)
      })
      return classes
    },
    displayClasses: function() {
      var classes = this.cleanClasses()
      classes.push(this.block.type)
      classes.push('content')
      if (this.subtask.comment) {
        classes.push('has-fix-comment')
      }
      return [...new Set(classes)].join(' ')
    },
    classTypeMatch: function(type) {
      let allClasses = this.cssList(this.block.classes)
      for (let cls of this.blockTypeClasses[type]) if (allClasses.indexOf(cls)>-1) {
        return cls
      }
    },
    addClass: function(clss) {
      var oldList = this.cssList()
      this.block.classes.push(clss.trim().toLowerCase())
      this.block.classes = this.cssList()
      if (this.block.classes != oldList) this.block.edited = true;
    },
    deleteBlock: function() {
      this.block._deleted = true
      this.deleted = true
      this.block.edited = true
    },
    unDeleteBlock: function() {
      if (!this.block._deleted) return;
      this.block._deleted = false
      this.deleted = false
      this.block.edited = false
    },
    editedContent: function(newContent) {
      //console.log("Editor content changed... ")
      newContent = newContent.replace(/<[\/]?p.*?>/ig, '')
      this.block.content = newContent
      this.block.edited = true
    },
    showEditor: function() {
      var vm = this
      if (this.isEditing) this.isEditing = false
        else {
          this.$events.emit('currentEditingBlockId', this.blockId)
          setTimeout(function(){vm.isEditing = true}, 50)
          //vm.isEditing = true;
        }
    },
    hideEditor: function(){
      console.log("Caught ESC")
      this.$events.emit('currentEditingBlockId', '')
    },
    rejectBlockContent() {
      var self = this
      if (self.rejectBlockContentMessage) {
        axios.put(self.API_URL + 'task/' + self.mainTaskId + '/reject_block_content', {
          'message': self.rejectBlockContentMessage,
          'blockid': self.block.id
        })
          .then((resp) => {
            self.showRejectContentModal = false
            self.rejectBlockContentMessage = ''
            self.$emit('block_content_rejected')
          })
          .catch((err) => {
            self.rejectBlockContentMessage = ''
            self.showRejectContentModal = false
          });
      }
    },
    fixBlockContent() {
      var self = this
      axios.put(self.API_URL + 'task/' + self.mainTaskId + '/fix_block_content', {
        'blockid': self.block.id
      })
        .then((resp) => {
          self.$emit('block_content_fixed')
        })
        .catch((err) => {

        });
    }

  },
  mounted() {
    var vm = this
    this.$events.on('currentEditingBlockId', function(blockId) {
      if (blockId != vm.blockId) vm.isEditing = false
    })
  },

  watch: {
    'block._deleted': function(to, from) {
      // console.log('toggle delete: ', to)
      this.deleted = to
    },
    'block.type': function(to, from) {
      // console.log('Block type change: ', from, to, 'edited: '+this.block.edited)
      if (this.blockTypes.indexOf(to)<0) this.block.type = from
        else this.block.edited = true
    },
    'block.edited': function(to, from) {
       // console.log('Block '+this.blockId+' Edited', from, to)
       this.$emit('edited', this.block)
    },
    'rejectBlockId': function(to, from) {
      if (from == null) {
        this.showRejectContentModal = true
      }
    },
    'showRejectContentModal': function(to, from) {
      if (to === false) {
        this.rejectBlockId = null
      }
    }

  },




}
</script>

<style scope>
.viewer {
  display: table; width: 100%;
  /*border: 1px solid red; */
}
.viewer tr {vertical-align: top; }

/* Block Content */
.viewer td.viewercontent {
  width: 100%; padding: .25em; padding-bottom: .5em;
  /*border-bottom: .5px dashed silver;*/
  padding-top: 0;
  /*vertical-align: top;*/
  font-family: 'gentium', serif; font-size: 1.5em;
  text-align: justify; justify-content: space-between;
  height: 6em;
  position: relative;
}
div.content {
  background: rgba(219, 232, 255, 0);
  border: .25px solid rgba(219, 232, 255, 0);
  border-radius: .25em;
}
@font-face {
  font-family: 'gentium';
  src: url('/static/fonts/GentiumPlus-R.woff') format('woff') /* Pretty Modern Browsers */
}
/*Display block classes and type on mouseover*/
.blockinfo {
 position: relative; height: 2em;
 top: 0; left: 0;
 font-size: .5em; font-family: arial;  color: gray;
 padding: 0;
 display: block;
 width: 100%;
}
.blockinfo-content {
  display: none;
}
.blockinfo .edit {
  font-size: 1.25em; padding-right: 3em;
  display: inline;
}
.blockinfo .type {
  color: gray;
  font-weight: bold;
  border-radius: 3px;
  display: inline;
}
.blockinfo .classes {
   float: right;
}
td.viewercontent:hover > div.blockinfo div.blockinfo-content  {
  display: block;
}

td.viewercontent:hover > div.content  {
  background: rgba(219, 232, 255, .3);
  border: .25px solid rgba(219, 232, 255, 1);
  border-radius: .25em;
}

/* Audio Editing and Proofing controls*/
.viewer td.editing {
  min-width: 2em; padding: .25em; position: relative;
}
td.editing div.tools {
  width: 100%;
  text-align: center;
  display: none;
}
td.editing div.editor {
  position: absolute; bottom: .5em;;
}
td.viewercontent:hover + td.editing div.tools, td.editing:hover > div.tools {
  display: block;
}
div.tools i {color: gray}
i.fa:hover {color: green}
i.fa-microphone:hover, i.fa-stop-circle-o:hover  {color: maroon}

.clearfix:after {
  content: "";
  display: table;
  clear: both;
}

div.par {display: block;}

div.viewercontent.ilm-block div.content.par.dropcap::first-letter {
  border: 2px solid silver;
  float: left !important; padding-left:0; font-style: 10em;; text-indent:0; color: darkgreen;
  margin-right: .1em; font-size: 3em; margin-top: -.12em; margin-bottom: -.5em;
}

.menulink:hover { cursor: pointer; color: navy; }
.edit_buttons { cursor: pointer; display: inline; }
.undeletebutton { text-align: center; font-size: 12pt; margin-bottom:-55px; margin-left: 1em;}

.wysiwygeditor_wrapper {padding: 10px; padding-right: 1em; }

.reject-block-message { width: 100%; min-height: 100px; }
.fix-message { color: red; background-color: yellow; }
.has-fix-comment { border: 1px solid red !important; }

</style>
