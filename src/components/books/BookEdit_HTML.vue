<template>
  <div class='bookeditor'>
  <button id="save2" @click="savecontent" class=" button save fa fa-floppy-o"></button>  
    <pre v-text="bookhtml" contenteditable="true" id="contentHTML"></pre>
    
  </div>
</template>

<script>
 import pretty from'pretty';
 import cheerio from 'cheerio';

 export default { 

  name: 'BookEditHtml',
  
  data() { 
    return {
      data: '',
      componentState: 'start'
    }
  },
  
  methods:{
     savecontent: function(){
      let data = [];
      let t = document.getElementById('contentHTML').outerHTML;
      t = t.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      let c = cheerio.load(t);
      c('#book').find("div").each(function(i, el){
        let item = {};
        item.id = c(el).attr('id');
        if(c(this).data('parnum')){ item.parnum = c(this).data('parnum');}
        item.content = c(this).text();
        item.classes = c(this).attr('class').split(' ');
        data.push(item);
      });
      try { this.$store.state.currentBook.content = JSON.parse(JSON.stringify(data));}
      catch(e) { alert('An error has occurred: '+e.message);}
    }
  },

  components: {
  },

  computed: {
    bookhtml: function() {
      let book = this.$store.getters.currentBook;
      let h = document.createElement('div');
      h.setAttribute('ID', 'book');
      book.content.forEach( function(block){
        let div = document.createElement('div');
        let t = document.createTextNode(block.content);
        div.appendChild(t);
        div.setAttribute('id', block.id);
        block.classes.forEach(function(c){div.className += c+' ';});
        div.className = div.className.trim();
        if(block.hasOwnProperty("parnum")){div.dataset.parnum = block.parnum;}
        h.appendChild(div);
      });
      return pretty(h.outerHTML).replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }
  }  
  
 }
</script>


<style scoped>
pre {
    white-space: pre-wrap;
    background-color: purple;
    color: yellow;
}
 .save {float:right;}
</style>
