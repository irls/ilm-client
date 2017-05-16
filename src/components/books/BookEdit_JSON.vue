<template>

  <div class='bookeditor'>
    <h3>Meta Data</h3>
      <div class="box">
         <button id="save" @click="saveMeta" class=" button save fa fa-floppy-o"></button>
         <pre id="metadata" contenteditable="true" class="json-text " v-html="metaHTML"></pre>
      </div>

      <h3>Content</h3>
      <div>    
         <button id="save2" @click="saveContent" class=" button save fa fa-floppy-o"></button>    
          <pre id="contentdata" contenteditable="true" class="json-text" v-html="contentHTML"></pre>
      </div>
  </div>

</template>

<script>
  import Vue from 'vue'
  import access from "../../mixins/access.js"
  import PouchDB from 'pouchdb'

export default {

  name: 'BookEditJson',

  data () {
    return { 
      componentState: 'start', 
      metaHTML: "<b>No Meta!</>",
      contentHTML: "<b>No Content!</>"
    }  
  },

  mixins: [access],
  
  methods: {
    // converts JSON object into pretty formated string
    formatedJSON: function(x) {
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

    saveMeta: function() { 
      let vm = this
      let t =  document.getElementById('metadata').textContent
      try { 
        let data = JSON.parse(t)
        let db = this.libraryDBmeta()
        db.get(data._id).then(function(doc){ // get new version doc        
          data._rev = doc._rev // update new data with new _rev 
          db.put(data).then(data => { // post up the new data and return the newer _rev
            db.get(data.id).then(newdoc => {                                 
              vm.$store.state.currentBookMeta = JSON.parse(JSON.stringify(newdoc))             
            })
          }).catch(err => console.log(err))
        }) 
      }
      catch(e) {
        alert('An error has occurred: '+e.message)
      }
    },

    saveContent: function() {
      let vm = this
      let t =  document.getElementById('contentdata').textContent
      try { 
        let data = JSON.parse(t)
        let db = this.libraryDB()
        db.get(data._id).then(function(doc){
          data._rev = doc._rev
          db.put(data).then(data => {
            db.get(data.id).then(newdoc => { 
              vm.$store.state.currentBook = JSON.parse(JSON.stringify(newdoc))
            })  
          }).catch(err => console.log(err))  
        })
      }    
      catch(e) { 
        alert('An error has occurred: '+e.message);
      } 
    }
  },

  computed: {
    // contentjson: function() {
    //   let x = Object.assign({}, this.$store.state.currentBook);
    //   let str = JSON.stringify(x, undefined, 4);
    //   return str.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    //     function (match) {
    //       let cls = 'num';
    //       if (/^"/.test(match)) { if (/:$/.test(match)) { cls = 'key';} else { cls = 'string';} }  
    //       else if (/true|false/.test(match)) { cls = 'boolean';}
    //       else if (/null/.test(match)) {cls = 'null';}
    //       return '<span class="' + cls + '">' + match + '</span>';
    //     });
    // }
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
    this.metaHTML = this.formatedJSON(this.$store.state.currentBookMeta)
    this.contentHTML = this.formatedJSON(this.$store.state.currentBook)
  },
}
</script>



<style scoped>
  pre {
    white-space: pre-wrap;
    background-color: black;
    color: white;
  }

  .save {float:right;}
  .string { color: green; }
  .num { color: darkorange; }
  .boolean { color: blue; }
  .null { color: magenta; }
  .key { color: red; }

</style>
