<template>
  <div class='titleblock ocean'>
  <table><tr>
    <td><img class='cover' :src='book.meta.coverimg'/></td>
    <td>
      <h1 class='title' v-text='book.meta.title' />
      <h2 class='subhead author' v-text='book.meta.author' />
      <p v-text='book.meta.description' />
    </td></tr>
  </table>

<hr class='small'>


  </div>
</template>

<script>

export default {
  data () {
    return {
      data: '',
    }
  },
  components: {

  },
  methods: {
    // block_tag: function(type) {
    //   return 'p'
    // },
    // hasClass: function(block, cssclass) {
    //   let list = block.classes.toLowerCase().trim().split(' ');
    //   return (list.indexOf(cssclass.toLowerCase()) > -1)
    // },
    // showID: function(block) {
    //   let showid = ((block.type==='par') && !this.hasClass(block, 'noid'))
    //   //console.log(showid, block.tag, block.classes)
    //   return showid
    // },
    // renumberPar(block, newNum) {
    //
    // },
    // renumberPars(from, startnum) {
    //
    // },
    // toggleIDvisibility(block) {
    //   if (!block.type=="par") return; // this should only apply to par types
    //   if (this.showID(block)) {
    //     // append _ to id, user can edit later if this is not sufficent
    //     // if X.y format, loop through folowing blocks with same X and decrement y
    //        // else, loop through all remaining blocks and decrement
    //   } else {
    //     // remove _ to make block numeric
    //     // if
    //
    //   }
    // },
    // hideParNum: function(block) {
    //   alert('Hiding Paragraph Number'+ block.id)
    // },
    // showParNum: function(block) {
    //   alert('Unhiding Paragraph Number'+ block.id)
    // },
    // insertBlockBelow: function (block) {
    //   alert('Inserting new Block after '+block.id)
    // },
    // removeBlock: function(block) {
    //   alert('Merging block into '+block.id)
    // },
    // editBlockid: function(block) {
    //   alert('Editing block id '+block.id)
    // },






  },
  computed: {
    book: function() {
      return this.$store.getters.currentBook
    },
    // currentBookContentBlocks: function () {
    //   //console.log("currentBookContentBlocks", this.currentBook)
    //   this.book = this.currentBook
    //   if (this.book.hasOwnProperty('content_blocks')) {
    //     //console.log(this.book.content_blocks)
    //     return this.book.content_blocks
    //   }
    //   else return []
    // }
  },


}
</script>


<style scope>
  img.cover {max-width: 300px;}
  .titleblock table {
    width: 100%;
  }
  .titleblock table td {vertical-align: top}
  .titleblock table td:nth-child(2) { padding: 2em;}

  .clearfix:after {
    content: "";
    display: table;
    clear: both;
  }
</style>
