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
    <td class='viewercontent ocean' v-else>

      <!-- Editor toolbar, only visible for editors -->
      <div class='blockinfo'><div class='blockinfo-content'>

<template v-show="isAdmin || isEditor || isLibrarian">

        <div class='edit_buttons'>
          <i class="fa fa-trash-o fa-lg deletebutton" @click='deleteBlock()'></i> &nbsp;
          <i class="fa fa-pencil-square-o fa-lg editbutton" @click='editBlock()'></i>
        </div> &nbsp;

        <div class='type'>
          <!-- Block Type selector -->
          <select v-model='block.type'>
            <option v-for="(type, index) in blockTypes" :value="type">{{ type }}</option>
          </select>

          <!-- All block classes -->
          <span v-for='classType of Object.keys(blockClasses)' class='menulink'>
            &nbsp; &nbsp; &nbsp;
            <!-- <dropdown :visible="visible" :position="position" @clickOut="visible = false">

              {{classType}} <i class="fa fa-caret-square-o-down" @click="visible = true"></i>
              <div class="inlineBlock hero is-primary" @click="visible = true">
                <div class="hero-body">Link</div>
              </div>
              <div slot="dropdown" class="dialog">
                Content
              </div>

            </dropdown> -->

            <!-- <select>
              <option v-for="(clss, index) in blockClasses[classType]" :value="clss">{{ clss }}</option>
            </select> -->
          </span>


          <!-- Type specific classes -->
          <!-- <select v-if='blockTypeClasses.length>0' v-model='blockTypeClass'>
            <option v-for="(clss, index) in blockTypeClasses" :value="clss">{{ clss }}</option>
          </select> -->
        </div>
</template>

        <div class='classes' v-if='cleanClasses().length>0'><i>{{ cleanClasses() }}</i></div>
      </div></div><div class='clearfix'></div>

      <!-- Content -->
      <hr v-if="block.type==='hr'" :class="displayClasses()" :id="block.id"/>
      <div v-else :class="displayClasses()" v-html='block.content' :id="block.id"></div>

    </td>

    <!-- Editing, Proofing and Recording Tools -->
    <td class='editing' v-if='!isEditing' v-show="!deleted && block.type!='hr'">

<template v-show="isAdmin || isReader">
      <!-- audio play and record -->
      <div class="tools audio">
        <i class="fa fa-play-circle-o fa-lg" @click='clickEvent(b)' v-if='!isPlaying'></i>
        <i class="fa fa-pause-circle-o fa-lg" @click='clickEvent(b)' v-if='isPlaying'></i>
        <i class="fa fa-microphone fa-lg" @click='clickEvent(b)' v-if='!isRecording'></i>
        <i class="fa fa-stop-circle-o fa-lg" @click='clickEvent(b)' v-if='isRecording'></i>
      </div>
</template>

<template v-show="isAdmin || isEditor || isLibrarian">
      <!-- editor approve and comment -->
      <div class="tools editor">
        <i class="fa fa-thumbs-o-up fa-lg" @click='clickEvent(b)'></i>
        <i class="fa fa-comment-o fa-lg" @click='clickEvent(b)'></i>
      </div>
</template>

    </td>

  </tr></table>
</template>


<script>
import dropdown from 'vue-my-dropdown'
import access from "../../mixins/access.js"

export default {
  data () {
    return {
      visible: false,
      deleted: false,
      modified: false,
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
      typeClasses: [' ', 'subtitle', 'author', 'translator'], // classes available for this type
      blockClasses: {
        Author: [' ', 'bab', 'baha', 'shoghi', 'sacred', 'bible', 'muhammad', 'quran', 'jesus', 'ali', 'tradition', 'husayn'],
        Justify: [' ', 'center', 'right', 'left'],
        Whitespace: [' ', 'verse', 'pre'],
        Style: [' ', 'allcaps', 'smallcaps', 'italic', 'bold', 'underline', 'rulebelow', 'bookgraphic'],
        Padding: ['nopad', 'nopad-top', 'nopad-bottom', 'pad', 'pad-top', 'pad-bottom'],
        Format: ['blockquote', 'sitalcent', 'editor-note', 'question', 'signature', 'reference', 'preamble', 'prayer'],
        Size: ['xx-small', 'x-small', 'small', 'large', 'x-large', 'xx-large'],
        Font: [' ', 'typewriter', 'oldbook', 'modern']
      },
      isRecording: false,
      isPlaying: false,
      isEditing: false,
    }
  },
  props: ['block', 'blid'],
  components: {
    dropdown,
  },
  mixins: [access],
  methods: {
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
    editBlock: function() {
      this.block.edited = true;
    },
  },

  computed: {
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
       // console.log('Block '+this.blid+' Edited', from, to)
       this.$emit('edited', this.block)
    }
  }
}
</script>



<style lang='less' src='./css/ocean.less'></style>
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

div.viewercontent.ocean div.content.par.dropcap::first-letter {
  border: 2px solid silver;
  float: left !important; padding-left:0; font-style: 10em;; text-indent:0; color: darkgreen;
  margin-right: .1em; font-size: 3em; margin-top: -.12em; margin-bottom: -.5em;
}

.menulink:hover { cursor: pointer; color: navy; }
.edit_buttons { cursor: pointer; display: inline; }
.undeletebutton { text-align: center; font-size: 12pt; margin-bottom:-55px; margin-left: 1em;}

</style>
