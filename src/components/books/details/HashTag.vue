<template>
  <div>
  <ul class="tag-with-autosuggestion el-input el-input--small" @click="focusInput">
  <!--<transition-group name="list-complete" tag="p">-->
    <li class="tag-name list-complete-item" v-for="(tag,index) in tags" :key="tag">
      {{tag}}
      <span v-if="adminOrLibrarian" class="tag-remove" @click="remove(index)"><i class="fa fa-times-circle-o" aria-hidden="true"></i></span>
    </li>
    <li class="tag-input list-complete-item" key="tag-input">
      <input type="text" ref="input" class="tag-input-inner" name="tag" v-model="name" @keyup.enter.prevent="checkAndAdd" autocomplete="off" autofocus="on" @keyup="validateKeyStroke" @keydown="select" @keyup.delete="removeLastItem">
      <div class="tag-suggestions-list" v-if="listSuggestions.length">
        <!-- <div class="suggestions-wrapper"> -->

          <li v-for="(tag,index) in listSuggestions" :class="highlight==index?'sugessted-tags sugessted-tags--highlight ' : 'sugessted-tags'" @click="add(tag)" ref="results" v-if="tag">
              {{tag}}
          </li>
        <!-- </div> -->
      </div>
    </li>
  <!--</transition-group>-->
    <li class="a-lb show-suggestion-btn suggestion-btn" v-if="suggestions.length && adminOrLibrarian" @click="showAll=!showAll ">{{showAll ? 'Hide Recommended': 'Recommended'}}
    </li>
  </ul>
  <transition name="fade">
  <div v-if="showAll">
    <ul class="all-suggesions tag-with-autosuggestion el-input el-input--small">
       <!--<transition-group name="list-complete">-->
       <li class="tag-name list-complete-item" v-for="(tag,index) in top" @click="addFromSuggestion(tag, $event)" :key="index">
        {{tag}}
       </li>
     <!--</transition-group>-->
       <li class="a-lb show-suggestion-btn" @click="filter=!filter" v-if="top.length > 100">
         {{suggestionsLen}}
       </li>
    </ul>
  </div>
</transition>
</div>
</template>

<script>
  import { mapGetters, mapActions } from 'vuex'
  export default{
    name:'Tag',
      model: {
    prop: 'tags',
    event: 'change'
  },
  props:{
    tags:{
      type:Array,
      required:true
    },
    suggestions:{
      type:Array,
      required:false,
      default:() => {
        return[]
      }
    },
    suggestionLength:{
      type:Number,
      required:false,
      default:10
    }
  },
    data(){
      return{
        name:'',
        highlight:-1,
        pause:true,
        filter:true,
        showAll:false
      }
    },
    watch:{
      listSuggestions(newVal){
        if(!this.listSuggestions){
          this.highlight=-1;
        }
        if(typeof(this.listSuggestions)=='object' && this.highlight ==-1){
          this.highlight=0;
        }
        // if(this.listSuggestions.length > 0 && this.highlight==-1){
        //   this.highlight=0;
        //   // console.log("s")
        // }
      },
      highlight(newVal, oldVal){
        if(newVal <= -2){
          this.highlight=-1;
        }
      }
    },
    computed:{
      suggestionsLen(){
        if(this.suggestionLength > this.suggestions.length-1) {
          return ''
        }
        let length = this.suggestions.length-this.suggestionLength
      return (this.filter && length > 0) ? `${length} More Tags`:'Hide Tags'
      },
      top(){
        let recommended = [
            "Ocean Book",
            "Baha’i Book",
            "Baha’i Book Compilations",
            "The Bible KJV",
            "The Bible JPS",
            "Compilations",
            "IVY 1",
            "IVY 2",
            "Robinson List",
            "Reading Challenge",
            "New Authors",
            "No audio Book",
            "The Gospels",
            "Beatrix Potter",
            "IVY League",
            "Training",
            "Testing"
            ];
        return recommended;
        //return this.filter ? this.suggestions.slice(0,this.suggestionLength) : this.suggestions
      },
      listSuggestions(){
        if(this.name.trim()==''){
          return false;
        }
        let tags = new Set()
        tags = this.suggestions.filter(x => {
          if(x.toString().toLowerCase().includes(this.name.toString().toLowerCase())){
            return x
          }
        })
        let isExist;
        if(tags.length!=0){
           isExist = this.tags.findIndex(x=>{
            if(!x){
              return
            }
            return x.toString().toLowerCase()==this.name.toString().toLowerCase()
          })
        }

        let currentTag = this.name

        let suggestions = tags.filter(x => {
          let findIndex = this.tags.findIndex(tag=> tag.toString().toLowerCase() == x.toString().toLowerCase());
          if(findIndex==-1){
            return x
          }
        }
          )
        suggestions.unshift(currentTag)
        return suggestions
      },
      ...mapGetters(['adminOrLibrarian'])
    },
    created(){
    },
    mounted(){
    },
    methods:{
      validateKeyStroke(e){
        if(this.highlight > this.listSuggestions.length || !this.listSuggestions){
          this.highlight=-1;
        }
        /*if(e.keyCode == 188) {
          this.name = this.name.split(',')[0]
          this.checkAndAdd()
          return false
        }*/
      },
      addFromSuggestion(name,event){
          const isExist = this.tags.findIndex(x=>{
            if(!x){
              return
            }
            return x.toString().toLowerCase()==name.toString().toLowerCase()
          })
          if(isExist==-1){
            //this.tags.push(name);
            this.$emit('addItem', name)
          }
          else {
            event.target.classList.add('shake')
            setTimeout( () => {
            event.target.classList.remove('shake')
                      } , 1000)
          }
      },
      checkAndAdd(){
        this.name=this.name.trim()
        if(this.name==''){
          return
        }

        //const isExist = () => this.tags.findIndex(x=>x.toLowerCase() == this.name.toLowerCase())
        const isExist = () => this.tags.findIndex(x=>x == this.name)

        if(this.highlight<1){
          if(isExist(this.name)!==-1){
          this.$refs.input.style.color='red'
            setTimeout( () => {
              this.$refs.input.style.color='initial'
                      } , 1000)
            return
          }
          this.add(this.name);
        }
        else{
          if(this.listSuggestions.length==0){
            this.add(name);
            return
          }
          let name = this.listSuggestions[this.highlight] || false;
          if(isExist(name)==-1){
            this.add(name)
          }
          return
        }
        this.add(this.name)
      },
      select(e){
        if(!this.listSuggestions || this.highlight < -1 || !this.listSuggestions.length){
          return
        }
        if (e.keyCode == 40)
        {
          if(this.listSuggestions.length-1 == this.highlight){
            this.highlight=0;
            return
          }
          this.highlight++;
        }
        if(e.keyCode==38)
        {
          if(this.highlight==0){
            this.highlight = this.listSuggestions.length;
          }
          this.highlight--;
        }
      },
      remove(i){
        this.$emit('removeItem',i)
      },
      add(name){
        if (name == '' || this.tags.includes(name)) return

        this.$emit('addItem', name)
        this.name='';
        this.highlight =-1;
        this.pause=true;
      },
      removeLastItem(){
        if(this.name.length<=0 && this.pause){
          this.pause=false
          return
        }
        // this.pause=true
        if(this.tags.length && this.name.length<=0){
          this.remove(this.tags.length-1)
          this.pause=true
        }
      },
      focusInput(){
        this.$refs.input.focus();
      }
    }
  }
</script>

<style scoped>
.tag-with-autosuggestion {
  min-width: 100px;
  min-height: 90px;
  border: 1px solid #eee;
  list-style: none;
  padding: 0;
  margin: 0;
  display: inline-block;
  margin-top: 1rem;
  width: 100%;
  border-radius: 4px;
  padding-bottom: 1rem;
  text-align: left;
  position: relative;
}
.tag-with-autosuggestion .a-lb {
  cursor: pointer;
}
.tag-with-autosuggestion .tag-name {
  background-color: #eee;
  width: auto;
  display: inline-block;
  margin: 5px;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  /*cursor: pointer;*/
}


.tag-with-autosuggestion .tag-name .tag-remove {
color: inherit;
font-weight: inherit;
opacity:0.8;
font-size: 1em;
cursor: pointer;
}
.tag-with-autosuggestion .tag-name:first-letter {
  /*text-transform: uppercase;*/
}
.tag-with-autosuggestion .tag-input {
  display: inline-flex;
  position: relative;
  margin: 5px;
  min-width: 85px;
  min-height: 30px;
}
.tag-with-autosuggestion .tag-input .tag-input-inner {
  border: none;
  outline: none;
  box-shadow: none;
  background: transparent;
}
.tag-with-autosuggestion .tag-input .tag-suggestions-list {
  border-radius: 2px;
  position: absolute;
  left: 0;
  right: 0;
  top: 100%;
  border: 1px solid #eee;
  margin-top: -8px;
  z-index: 100;
}
.tag-with-autosuggestion .tag-input .tag-suggestions-list .sugessted-tags {
  overflow: hidden;
  text-overflow: ellipsis;
  background: #fff;
  padding: 3px;
  cursor: pointer;
}
.tag-with-autosuggestion .tag-input .tag-suggestions-list .sugessted-tags--highlight {
  background: #eee;
}
.tag-with-autosuggestion .show-suggestion-btn {
  margin-right: 5px;
}

.suggestion-btn {
  color: #3187d5;
  text-decoration: underline;
  cursor: pointer;
}

.all-suggesions .tag-name {
  background: #eee;
  cursor: pointer;
}
.shake {
  animation: shake 0.82s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
  perspective: 1000px;
  color: red;
}
.a-lb{
    cursor: pointer;
    position: absolute;
    bottom: 10px;
    right: 0;
}
@keyframes shake {
  10%, 90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%, 80% {
    transform: translate3d(2px, 0, 0);
  }
  30%, 50%, 70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%, 60% {
    transform: translate3d(4px, 0, 0);
  }
}
.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  opacity: 0;
}
.list-complete-item {
  transition: all 1s;
  display: inline-block;
  margin-right: 10px;
}
.list-complete-enter, .list-complete-leave-to{
  opacity: 0;
  transform: translateY(20px);
}
.list-complete-leave-active {
  position: absolute;
}
</style>
