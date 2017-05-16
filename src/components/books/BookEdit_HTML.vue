<template>
  <div class='bookeditor'>
  <button id="save2" @click="savecontent" class=" button save fa fa-floppy-o"></button>  
    <pre v-text="HTMLcontent" contenteditable="true" id="contentHTML"></pre>
    
  </div>
</template>

<script>
import Vue from 'vue'
import access from "../../mixins/access.js"
import PouchDB from 'pouchdb'
import pretty from'pretty';
import cheerio from 'cheerio';

 export default { 
  name: 'BookEditHtml',
  data() { 
    return {
      componentState: 'start',
      HTMLcontent: "<b>No Content!</b>"
    }
  },

  mixins: [access],

  methods:{
    savecontent: function(){
      let vm = this
      let data = this.html2json(document.getElementById('contentHTML').outerHTML)
      let book = this.$store.state.currentBook
      book.content = data    
      try {
        let db = this.libraryDB()
        db.get(book._id).then(function(doc){
          book._rev = doc._rev 
          db.put(book).then(book => {
            db.get(book.id).then(newbook => {
              vm.$store.state.currentBook = JSON.parse(JSON.stringify(newbook))
            })
          }).catch(err => console.log(err))
        })
      }         
      catch(e) { 
        alert('An error has occurred: '+e.message)
      }
    },

    // returns an array of objects, one per div
    html2json: function(t){
      let data = []
     // let t = document.getElementById('contentHTML').outerHTML;
      t = t.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      let c = cheerio.load(t)
      c('#book').find("div").each(function(i, el){
        let item = {}
        item.id = c(el).attr('id')
        if(c(this).data('parnum')){ 
          item.parnum = c(this).data('parnum')
        }
        item.content = c(this).text()
        item.classes = c(this).attr('class').split(' ')
        data.push(item)
      }); 
      return data
    },

    // converts json object to formated html string
    json2html: function(book){
      let h = document.createElement('div')
      h.setAttribute('ID', 'book')
      book.content.forEach( function(block){
        let div = document.createElement('div')
        let t = document.createTextNode(block.content)
        div.appendChild(t)
        div.setAttribute('id', block.id)
        block.classes.forEach( function(c){
          div.className += c+' '
        })
        div.className = div.className.trim()
        if(block.hasOwnProperty("parnum")){
          div.dataset.parnum = block.parnum
        }
        h.appendChild(div)
      });
      return pretty(h.outerHTML).replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    }

  },

   mounted: function() {
    this.HTMLcontent = this.json2html(this.$store.getters.currentBook)
   }  
  
 }
</script>


<style scoped>
pre {
    white-space: pre-wrap;
    background-color: white;
    color: black;
}
 .save {float:right;}
</style>
