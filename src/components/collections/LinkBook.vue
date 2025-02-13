<template>
  <div>
    <modal
      name="example-modal"
      transition="nice-modal-fade"
      :adaptive="true"
      :resizable="true"
      width="80%"
      height="80%"
      @before-open="modalOpened"
      @before-close="modalClosed">
      <div class="link-book-modal-wrapper">
        <div class="modal-header">
          <div class="header-title">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="$emit('close_modal')">
            <i class="fa fa-times-circle-o" aria-hidden="true"></i>
            </button>
            <h4>Add books</h4>
          </div>
          <div class="col-sm-12">
            <div class="col-sm-3">
              <div class="col-sm-4">
                <label>
                  <i class="fa fa-check-square" v-if="allSelected" v-on:click="allSelected = false"></i>
                  <i class="fa fa-square" v-else v-on:click="allSelected = true"></i>
                  All
                </label>
              </div>
              <div class="col-sm-8">
                <input type="text" @keyup="filterChange('title', $event)" class="" placeholder="Search by author or title"></input>
              </div>
            </div>
            <div class="col-sm-3">
              <label>Language: </label>{{languages[currentCollection.language]}}
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
        <div class="modal-body">
          <div class="link-book-search"></div>
          <Grid id='books_grid' class="link-books-grid"
            :data="linkBooksList"
            :columns="headers"
            :rowsPerPage="100"
            @clickRow="rowClick"
            :selected="selected"
            :idField="idField"
            :filter-key="''"></Grid>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" :disabled="selected.length == 0" v-on:click="linkBooks(true)">
            <i class="fa fa-plus"></i>&nbsp;Add to collection<span v-if="selected.length > 0">&nbsp;({{selected.length}})</span>
          </button>
          <button class="btn btn-default" v-on:click="$emit('close_modal')">Cancel</button>
        </div>
      </div><!--<div class="link-book-modal-wrapper">-->
    </modal>
    <modal name="on-link-message" :height="150" :resizeable="false">
      <div class="modal-header"></div>
      <div class="modal-body">
        <p>This will remove {{relinkCount}} of the selected books from their current collection(s).</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-default" v-on:click="hideModal('on-link-message')">Cancel</button>
        <button class="btn btn-primary" v-on:click="linkBooks()">Confirm</button>
      </div>
    </modal>
  </div>
</template>
<script>
  import Grid from '../generic/Grid';
  import {mapGetters, mapActions} from 'vuex';
  import api_config from '../../mixins/api_config.js'
  import v_modal from 'vue-js-modal';
  import Vue from 'vue';
  Vue.use(v_modal, { dialog: true });
  export default {
      name: 'LinkBook',
      data() {
        return {
          headers: [
            {
              title: '',
              path: 'bookid',
              html (val) {
                return `<i class="fa fa-check-square toggle-select"></i><i class="fa fa-square toggle-select"></i><input type="checkbox" class="link-book-select-toggle" name="select-link-${val}"/>`
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
          idField: 'bookid',
          selected: [],
          booksFilter: {title: '', language: 'en', collection: 'not-linked', published: ''},
          relinkCount: 0
        }
      },
      props: ['languages'],
      components: {
        Grid: Grid
        //v_modal: v_modal
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
            let self = this;
            Vue.nextTick(() => {
              if (books.length == 0) {
                self.allSelected = false;
              } else {
                self.selected.forEach((s, i) => {
                  let b = books.find(_b => _b.bookid === s);
                  if (!b) {
                    self.selected.splice(i, 1);
                  }
                });
              }
            });
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
        allSelected: {
          get() {
            //console.log('CHECK ALL SELECTED', this.selected.length, this.linkBooksList.length);
            return this.selected.length > 0 && this.selected.length == this.linkBooksList.length;
          },
          set(val) {
            if (val === true) {
              this.linkBooksList.forEach(b => {
                if (this.selected.indexOf(b.bookid) === -1) {
                  this.selected.push(b.bookid);
                }
              });
            } else if (val === false) {
              this.selected = [];
            }
          }
        },
        ...mapGetters(['allBooks', 'currentCollection', 'bookCollections'])
      },
      methods: {
        rowClick(item, event) {
          if (event && event.target && event.target.className.indexOf('toggle-select') !== -1) {
            if (item && item.bookid) {
              $('[name="select-link-' + item.bookid + '"]').trigger('click');
            }
          }
        },
        showModal(name) {
          this.$modal.show(name);
        },
        hideModal(name) {
          this.$modal.hide(name);
        },
        linkBooks(check = false) {
          this.hideModal('on-link-message');
          if (check === true) {
            this.relinkCount = 0;
            this.selected.forEach(s => {
              let b = this.allBooks.find(_b => _b.bookid === s);
              if (b && b.collection_id) {
                ++this.relinkCount;
              }
            });
            if (this.relinkCount > 0) {
              this.showModal('on-link-message');
              return;
            }
          }
          if (this.selected.length > 0) {
            return this.linkBooksToCollection(this.selected)
              .then((response) => {
                if (response.status===200) {
                  this.$emit('close_modal');
                } else {

                }
              }).catch((err) => {

              });
          }
        },
        filterChange(field, event) {

          this.booksFilter[field] = event.target.type === 'checkbox' ? (event.target.checked ? '1' : '') : event.target.value;
        },
        modalOpened() {
          $('.fixed-wrapper .navtable').css('z-index', 0);
          $('.toolbar-wrapper .toolbar').css('z-index', 0);
        },
        modalClosed() {
          $('.fixed-wrapper .navtable').css('z-index', 999);
          $('.toolbar-wrapper .toolbar').css('z-index', 999);
        },
        ...mapActions(['linkBooksToCollection'])
      },
      mounted() {
        this.booksFilter.language = this.currentCollection.language;
        let self = this;
        this.showModal('example-modal');

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

.link-books-grid {
  height: 100%;
  overflow: auto;
  .link-book-select-toggle {
    display: none;
  }
  .grid-row {
    .fa-square {
      display: inline;
    }
    .fa-check-square {
      display: none;
    }
    &.selected {
      .fa-square {
        display: none;
      }
      .fa-check-square {
        display: inline;
      }
    }
  }
}
.link-books-grid::-webkit-scrollbar-track {
  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,0.3);
  border-radius: 10px;
  background-color: #F5F5F5;
}
.link-books-grid::-webkit-scrollbar {
  width: 12px;
  background-color: #F5F5F5;
}
.link-books-grid::-webkit-scrollbar-thumb {
  border-radius: 10px;
  -webkit-box-shadow: inset 0 0 6px rgba(0,0,0,.3);
  background-color: #555;
}
</style>

<style lang="less" scoped>

.link-book-modal-wrapper {
  height: 89%;
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

.modal-body {
  margin: 0px 0;
  height: 81%;
}

.modal-footer {}

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
      text-align: right;
      padding: 0px 15px;
    }
  }
}

</style>
