<template>
  <div class='bookeditor'>

    <h3>Meta Data</h3>
   
   <pre contenteditable="true" class="json-text" v-html="metajson"></pre>

    <h3>Content</h3>
    <pre contenteditable="true" class="json-text" v-html="contentjson"></pre>
 <!-- 
      <div v-for="bl in currentBookContentBlocks" v-html='bl.content'></div>
     <div :data-id="bl.id" :class='bl.classes' v-html="bl.content"/></div> -->

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
    },

    blockEnter: function(msg, e) {
      if(e) {
        e.preventDefault();
        e.stopPropagation();
      }  
    }

  },

  computed: {
    currentBook: function() {
      return this.$store.getters.currentBook
    },

    currentBookContentBlocks: function () {
      if (this.$store.getters.currentBook && this.$store.getters.currentBook.hasOwnProperty('content_blocks')) return this.$store.getters.currentBook.content_blocks
      else return []
    },

    metajson: function() {
      let x = Object.assign({}, this.$store.state.currentBookMeta);
      let str = JSON.stringify(x, undefined, 4);
      return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
          let cls = 'num';
          if (/^"/.test(match)) { if (/:$/.test(match)) { cls = 'key';} else { cls = 'string';} }  
          else if (/true|false/.test(match)) { cls = 'boolean';}
          else if (/null/.test(match)) {cls = 'null';}
          return '<span class="' + cls + '">' + match + '</span>';
        });

    },

    contentjson: function() {
      let x = Object.assign({}, this.$store.state.currentBook.content);
      let str = JSON.stringify(x, undefined, 4);
      return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        function (match) {
          let cls = 'num';
          if (/^"/.test(match)) { if (/:$/.test(match)) { cls = 'key';} else { cls = 'string';} }  
          else if (/true|false/.test(match)) { cls = 'boolean';}
          else if (/null/.test(match)) {cls = 'null';}
          return '<span class="' + cls + '">' + match + '</span>';
        });
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

  .string { color: green; }
  .num { color: darkorange; }
  .boolean { color: blue; }
  .null { color: magenta; }
  .key { color: red; }

</style>
