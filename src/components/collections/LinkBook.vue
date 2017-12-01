<template>
  <transition name="modal">
    <div class="modal-mask" @click="$emit('close_modal')">
      <div class="modal-wrapper">
        <div class="modal-container" @click="$event.stopPropagation()">

          <div class="modal-header">
            <div class="header-title">
              <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close_modal')">
              <i class="fa fa-times-circle-o" aria-hidden="true"></i>
              </button>
              <h4>Add books</h4>
            </div>
            <div class="col-sm-12">
              <div class="col-sm-3">
                <input type="text" @keyup="filterChange('title', $event)" class="" placeholder="Search by author or title"></input>
              </div>
              <div class="col-sm-3">
                <label>Language</label>
                <select @change="filterChange('language', $event)">
                  <option v-for="(name, code) in languages" :value="code">{{name}}</option>
                </select>
              </div>
              <div class="col-sm-3">
                <label>Collection</label>
                <select @change="filterChange('collection', $event)">
                  <option v-for="c in filterCollectionsList" :value="c._id">{{c.title}}</option>
                </select>
              </div>
              <div class="col-sm-3">
                <label>
                  <input type="checkbox" @change="filterChange('published', $event)"/>
                  Published
                </label>
              </div>
            </div>
          </div>
          <div class="modal-body clearfix">
            <div class="link-book-search"></div>
            <Grid id='books_grid'
              :data="linkBooksList"
              :columns="headers"
              :rowsPerPage="100"
              @clickRow="rowClick"
              :selected="selected"
              :idField="idField"
              :filter-key="''"></Grid>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" :disabled="selected.length == 0" v-on:click="onLinkMessage = true">
              <i class="fa fa-plus"></i>&nbsp;Add to collection<span v-if="selected.length > 0">&nbsp;({{selected.length}})</span>
            </button>
            <button class="btn btn-default" v-on:click="$emit('close_modal')">Cancel</button>
          </div>
        </div>
      </div>
      <modal v-model="onLinkMessage" effect="fade" title="" ok-text="Add to collection" cancel-text="Cancel" @ok="linkBooks()">
        <p>Add {{selected.length}} Books to "{{currentCollection.title}}" Collection?</p>
      </modal>
    </div>
  </transition>
</template>
<script>
  import Grid from '../generic/Grid';
  import {mapGetters} from 'vuex';
  import api_config from '../../mixins/api_config.js'
  import {modal} from 'vue-strap';
  export default {
      name: 'LinkBook',
      data() {
        return {
          headers: [
            {
              title: '',
              path: '_id',
              html (val) {
                return `<input type="checkbox" class="link-book-select-toggle" name="select-link-${val}"/>`
              }
            },
            {
              title: 'Title',
              path: 'title',
              addClass: 'booktitle'
            },
            {
              title: 'Author',
              path: 'author',
              addClass: 'author',
              render(val) {
                return val ? val.join(', ') : '';
              }
            },
            {
              title: 'Size',
              path: 'wordcount',
              render (val) {
                // return '~'+Math.round(val / 300) +'pg'
                return val ? `${Math.round(val / 300)} pages` : '0 pages';
              }
            },
            {
              title: 'Published',
              path: 'published',
              html (val) {
                return '<i class="fa ' + (val ? 'fa-check-square-o' : 'fa-square-o') + '"></i>'
              }
            }
          ],
          idField: '_id',
          selected: [],
          booksFilter: {title: '', language: 'en', collection: 'not-linked', published: ''},
          onLinkMessage: false
        }
      },
      props: ['languages'],
      components: {
        Grid: Grid,
        modal: modal
      },
      mixins: [api_config],
      computed: {
        linkBooksList: {
          get() {
            
            let books = [];
            this.allBooks.forEach(b => {
              if (b.collection_id != this.currentCollection._id) {
                books.push(b);
              }
            });
            
            for (var field in this.booksFilter) {
              let filter = this.booksFilter[field].toLowerCase();
              if (filter.length) {
                switch (field) {
                  case 'title':
                    books = books.filter(b => {
                      return (b.author && b.author.join('|').toLowerCase().indexOf(filter) !== -1) || (b.title && b.title.toLowerCase().indexOf(filter) !== -1);
                    });
                    break;
                  case 'language':
                    books = books.filter(b => {
                      return b.language == filter;
                    });
                    break;
                  case 'published':
                    books = books.filter(b => {
                      return b.published;
                    });
                    break;
                  case 'collection':
                    books = books.filter(b => {
                      
                      switch(filter) {
                        case 'not-linked':
                          return !b.collection_id;
                          break;
                        case 'all':
                          return !!b.collection_id;
                          break;
                        default:
                          return b.collection_id == filter;
                          break;
                      }
                    });
                    break;
                }
              }
            }
            
            return books;
          }
        },
        filterCollectionsList: {
          get() {
            let collections = [{'_id': 'not-linked', 'title': 'Not linked'}, {'_id': 'all', 'title': 'All collections'}];
            this.bookCollections.forEach(c => {
              if (c._id != this.currentCollection._id) {
                collections.push(c);
              }
            });
            return collections;
          }
        },
        ...mapGetters(['allBooks', 'currentCollection', 'bookCollections'])
      },
      methods: {
        rowClick(item) {
          if (item && item._id) {
            $('[name="select-link-' + item._id + '"]').trigger('click');
          }
        },
        linkBooks() {
          if (this.selected.length > 0) {
            let api_url = this.API_URL + 'collection/' + this.currentCollection._id + '/link_books';
            let api = this.$store.state.auth.getHttp();
            let self = this;
            api.post(api_url, {books_ids: this.selected}, {}).then(function(response){
              self.onLinkMessage = false;
              if (response.status===200) {
                self.$emit('close_modal');
              } else {
                
              }
            }).catch((err) => {
              self.onLinkMessage = false;
            });
          }
        },
        filterChange(field, event) {
          
          this.booksFilter[field] = event.target.type === 'checkbox' ? (event.target.checked ? '1' : '') : event.target.value;
        }
      },
      mounted() {
        let self = this;
        
        $('body').on('change', '.link-book-select-toggle', function(e) {
          let id = e.target.name.replace('select-link-', '');
          let index = self.selected.indexOf(id);
          if (e.target.checked) {
            if (index === -1) {
              self.selected.push(id);
            }
          } else {
            if (index !== -1) {
              self.selected.splice(index, 1);
            }
          }
        });
      }
  }
</script>
<style lang="less">
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  display: table;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 80%;
  margin: 0px auto;
  padding: 0px 0px;
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
  transition: all .3s ease;
  font-family: Helvetica, Arial, sans-serif;
}

.modal-header {
  padding-left: 0px;
  padding-right: 0px;
  padding-bottom:5px;
  .header-title {
    position: relative;
    h4 {
      text-align: center;
    }
    button {
      position: absolute;
      display: inline-block;
      float: right;
      width: 100%;
      text-align: right;
      padding: 0px 5px;
    }
  }
}

.modal-body {
  margin: 0px 0;
}

.modal-footer {

}
#books_grid {
  height: 200px;
  overflow: scroll;
}
#books_grid::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
  border-radius: 10px;
  background-color: #F5F5F5;
}
#books_grid::-webkit-scrollbar {
  width: 12px;
  background-color: #F5F5F5;
}
#books_grid::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
  background-color: #555;
}
</style>