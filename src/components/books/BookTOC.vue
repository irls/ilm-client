<template>
  <div class='titleblock ocean toc'>
    <h1 class='toclink header' @click='showtoc = !showtoc'>
      Table of Contents
      <i class="fa fa-caret-down" v-if="showtoc"></i>
      <i class="fa fa-caret-right" v-else></i>
    </h1>

     <div v-if='showtoc' v-html='tableofContents' />
    <hr class='small'>
  </div>
</template>



<script>
export default {
  data () {
    return {
      data: '',
      showtoc: false
    }
  },
  components: {

  },
  methods: {

  },
  computed: {
    book: function() {
      return this.$store.getters.currentBook
    },
    tableofContents: function() {
      let toc = [];
      for (let bl of this.book.content) {
        let newItem ='';
        // toc items are headers or subheaders with .toc class
        if (bl.type=='header') {
           let sectionName = this.book.sectionName ? this.book.sectionName+' ' : ''
           let sec = bl.secnum ? `${sectionName}${bl.secnum}. ` : ''
           toc.push(`<li class='head'><a href="#${bl.id}">${sec}${bl.content}</a></li>`)
        } else if (bl.type=='subhead') {
           let res = bl.classes.match(/toc\d/g)
           if (res) toc.push(`<li class='${res[0]}'><a href="#${bl.id}">${bl.content}</a></li>`)
        }
      }
      return '<ul class="toc"> \n'+ toc.join('\n  ')+"</ul>"
    },
  },

}
</script>




<style scope lang='less'>
  h1.toclink {
    color: navy;   cursor: pointer;
  }
  ul.toc {
    list-style: none;
    li.head {font-size: 1.5em;}
    li.toc1 {margin-left: 1.5em}
    li.toc2 {margin-left: 2.5em; font-size: .85em;}
    li.toc3 {margin-left: 3.5em; font-size: .75em;}
    li.toc4 {margin-left: 4.5em; font-size: .65em;}
  }
</style>
