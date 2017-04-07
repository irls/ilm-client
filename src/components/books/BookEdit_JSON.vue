<template>
  <div class='bookeditor'>

     <h1> Book Editor JSON </h1>

    <!-- <table class='editor'>
     <tr><td rowspan =
    </table> -->


      <div v-for="bl in currentBookContentBlocks" v-html='bl.content'></div>
      <!-- <div :data-id="bl.id" :class='bl.classes' v-html="bl.content"/></div> -->

  </div>
</template>

<script>


export default {

  name: 'BookEditJson',

  data () {
    return {
      data: '',
      tagtypes: {
        par: 'p',
        header: 'h1',
        subheader: 'h3'
      },
      componentState: 'start'
    }
  },
  components: {

  },
  methods: {
    block_tag: function(type) {
      return 'p'
    }
  },
  computed: {
    currentBook: function() {
      return this.$store.getters.currentBook
    },
    currentBookContentBlocks: function () {
      if (this.$store.getters.currentBook && this.$store.getters.currentBook.hasOwnProperty('content_blocks')) return this.$store.getters.currentBook.content_blocks
      else return []
    }
  },
  beforeCreate: function() {
    this.componentState = 'beforeCreate'
  },
  created: function() {
    //this.componentState = 'created'
  },
  beforeMount: function() {
    this.componentState = 'beforeMount'
  },
  mounted: function() {
    this.componentState = 'mounted'
  },
}
</script>


<style>
</style>
