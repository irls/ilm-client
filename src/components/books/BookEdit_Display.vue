<template>
  <div>
    <BookDisplayHeader />
    <BookTOC />
    <!-- <div v-for="bl in currentBookContentBlocks" v-html='bl.content'
        :class="[bl.classes ? bl.classes : '', 'blk '+bl.type]"></div> -->
    <div class='ocean showparnum' v-html='currentBookContent()'></div>
  </div>
</template>

<script>
import BookDisplayHeader from './BookDisplayHeader'
import BookTOC from './BookTOC'

export default {

  name: 'BookEditDisplay',

  data () {
    return {
      data: '',
    }
  },
  components: {
    BookDisplayHeader, BookTOC
  },
  methods: {
    block_tag: function(type) {
      let typetag = {
        title: 'h1',
        header: 'h2',
        subhead: 'h3',
        par: 'p',
        illustration: 'div',
        aside: 'aside',
        hr: 'hr'
      }
      if (typetag.hasOwnProperty(type)) return typetag[type];
    },
    cleanCSS: function(block, addType=false){
      if (!block.hasOwnProperty('classes')) return block.type
      let css = block.classes.toLowerCase().split(' ').filter(s => s.trim() != '')
      if (addType) css.push(block.type)
      css =  Array.from(new Set(css));
      if(block.type != 'par') css = css.filter(cl => cl!='noid')
      block.classes = css.join(' ')
      return block.classes.trim()
    },
    currentBookContent: function(){
      let book = this.$store.state.currentBook
      let meta = this.$store.state.currentBookMeta
      let blocks = this.currentBookContentBlocks
      let displayHTML= '';
      for (let block of blocks) {
        let tag = this.block_tag(block.type)
        let classes = this.cleanCSS(block, true)
        let parnum = (block.type=='par' && block.hasOwnProperty('parnum')) ? ` data-parnum="${block.parnum}"` : ''
        let secnum = (block.type=='header' && block.hasOwnProperty('secnum'))?` data-section="${block.secnum}"`:''
        let lang = ' lang="en"  dir="ltr"';
        let language = block.hasOwnProperty('lang') ? block.lang : meta.lang
        if (language) {
          lang = ` lang="${language}"`
          lang += ['fa','ar','iw'].indexOf(language)>-1 ? ` dir="rtl"` : ` dir="ltr"`
        }
        displayHTML+= `<${tag} class="${classes}"${parnum}${secnum}${lang}>${block.content}</${tag}>\n\n`
      }
      //console.log(displayHTML)
      return displayHTML
    }
  },
  computed: {
    currentBook: function() {
      return this.$store.getters.currentBook
    },
    currentBookContentBlocks: function () {
      if (this.$store.getters.currentBook && this.$store.getters.currentBook.hasOwnProperty('content')) return this.$store.getters.currentBook.content
      else return []
    },
  },
}
</script>


<style scope>
.ocean {
  width: 100%; padding: 1em;
  font-family: 'gentium', serif; font-size: 1.5em;
  text-align: justify; justify-content: space-between;
  color: black;
}
@font-face {
  font-family: 'gentium';
  src: url('/static/fonts/GentiumPlus-R.woff') format('woff') /* Pretty Modern Browsers */
}
.ocean.showparnum {
  padding-left: 2em;
}
.ocean p, .ocean h1, .ocean h2, .ocean h3 {
  margin-bottom: 1em;
}
</style>


<style lang='less' src='./css/ocean.less' scope></style>
