<template>
  <table class="library-books">
    <tr>
      <td :colspan="metaVisible ? 3 : 2">
        <div class="table library-books-toolbar">
          <div class="tr">
            <div class="td">
              <label>Library</label>
              <select v-model="filters.libraryId">
                <option v-for="lib in allLibrariesList" :value="lib._id">{{lib.title}}</option>
              </select>
              <label>Language</label>
              <select v-model="filters.language">
                <option v-for="lang in languagesList" :value="lang.code">{{lang.name}}</option>
              </select>
              <div class="search-wrapper">
                <input type="text" :class="['search', {'has-autocomplete': (filtersSearchSuggestions.length && searchSet !== filters.search) || (filters.search && filtersSearchSuggestions.length == 0)}]" placeholder="Search by author or title" v-model="filters.search" />
                <div :class="['search-autocomplete', {'hidden': !filters.search || searchSet === filters.search}]">
                  <template v-if="filtersSearchSuggestions.length">
                    <div v-for="f in filtersSearchSuggestions" v-html="f.label" v-on:click="setSearch(f.value)"></div>
                  </template>
                  <template v-else>
                    <div class="no-items">No matches found</div>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
    <tr :class="['grids', {'grids-3': metaVisible}]">
      <td>
        <div class="table">
          <div class="tr">
            <div class="td">
              <h4>Repository</h4>
            </div>
            <div class="td">
              <label>Category</label>
              <select v-model="repositoryFilters.category">
                <option></option>
                <option v-for="c in repositoryCategoriesList" :value="c">{{c}}</option>
              </select>
              <label>
                <input type="checkbox" v-model="repositoryFilters.allBooks"/>
                All Books</label>
            </div>
          </div>
        </div>
        <grid
          :data="repositoryBooksList"
          :columns="booksGridHeaders"
          :rowsPerPage="100"
          :idField="'_id'"
          @clickRow="clickRowRepositoryBooks"
          :customEmptyTableText="'No books'"
          :class="['books-grid', 'repository-books-grid']"
          :selected="[]"></grid>
      </td>
      <td>
        <div class="table">
          <div class="tr">
            <div class="td">
              <h4>{{selectedLibrary.title}}</h4>
            </div>
            <div class="td">
              <label>
                Status
                <select v-model="libraryFilters.status">
                  <option></option>
                  <option v-for="(n, k) in statusList" :value="k">{{n}}</option>
                </select>
              </label>
              <label>
                Category
                <select v-model="libraryFilters.category">
                  <option></option>
                  <option v-for="c in categoriesListShort" :value="c">{{c}}</option>
                </select>
              </label>
            </div>
          </div>

        </div>

        <div class="library-books-wrapper">
          <grid v-if="selectedLibrary._id"
            :data="libraryBooksList"
            :columns="libraryBooksGridHeaders"
            :rowsPerPage="100"
            :idField="'_id'"
            @clickRow="clickRowLibraryBooks"
            :customEmptyTableText="'No books'"
            :class="['books-grid', 'library-books-grid']"
            :selected="selectedBooks"></grid>
          <i :class="['fa', 'toggle-meta', {'fa-chevron-left': !metaVisible}, {'fa-chevron-right': metaVisible}]" v-on:click="toggleMetaOpened()" v-if="selectedBook._id"></i>
        </div>
      </td>
      <td v-if="metaVisible && selectedBook._id" class="meta-container">
        <div class="meta-wrapper">
          <table class="meta-header">
            <tr>
              <td rowspan="3" class="img-container" v-on:click="showBookCoverModal">
                <img class="cover-image" :src="selectedBookImage" v-if="selectedBookImage"/>
                <div v-else class="cover-image"></div>
              </td>
              <td>
                <h5>{{selectedBook.title}}</h5>
              </td>
            </tr>
            <tr>
              <td>{{selectedBook.author ? selectedBook.author.join(', ') : ''}}</td>
            </tr>
            <tr>
              <td>
                <button class="btn btn-default" v-on:click="showModal('on-remove-modal')">Remove</button>
                <button class="btn btn-default" v-if="selectedBook.status == 'published'" v-on:click="showModal('on-unpublish-modal')">Unpublish</button>
                <button class="btn btn-default" v-if="selectedBook.status == 'unpublished'" v-on:click="publish">Publish minor version</button>
                <button class="btn btn-default" v-if="selectedBook.status == 'new'" v-on:click="publish">Publish</button>
              </td>
            </tr>
          </table>
          <BookCoverModal ref="bookCoverModal"
            :currentImage="selectedBookImage"
            :libraryId="selectedLibrary._id"
            :bookId="selectedBook._id"
            @imageUpdated="bookImageUpdated"></BookCoverModal>
          <modal name="on-remove-modal"
            transition="nice-modal-fade"
            :adaptive="false"
            width="400px"
            height="200px"
            @before-open="modalOpened"
            @before-close="modalClosed">
            <div class="modal-header"></div>
            <div class="modal-body">
              Unpublish "{{selectedBook.title}}" and remove from the {{selectedLibrary.title}}?
            </div>
            <div class="modal-footer">
              <button class="btn btn-default" v-on:click="removeBookFromLibrary">Remove</button>
              <button class="btn btn-default" v-on:click="hideModal('on-remove-modal')">Cancel</button>
            </div>
          </modal>
          <modal name="on-published-modal"
            transition="nice-modal-fade"
            :adaptive="false"
            width="400px"
            height="200px"
            @before-open="modalOpened"
            @before-close="modalClosed">
            <div class="modal-header"></div>
            <div class="modal-body">
              "{{selectedBook.title}}" has been published
            </div>
            <div class="modal-footer">
              <button class="btn btn-default" v-on:click="hideModal('on-published-modal')">Close</button>
            </div>
          </modal>
          <modal name="on-unpublish-modal"
            transition="nice-modal-fade"
            :adaptive="false"
            width="400px"
            height="200px"
            @before-open="modalOpened"
            @before-close="modalClosed">
            <div class="modal-header"></div>
            <div class="modal-body">Unpublish "{{selectedBook.title}}"?</div>
            <div class="modal-footer">
              <button class="btn btn-default" v-on:click="unpublish">Unpublish</button>
              <button class="btn btn-default" v-on:click="hideModal('on-unpublish-modal')">Cancel</button>
            </div>
          </modal>
          <fieldset>
            <legend>Book Metadata</legend>
            <table class="meta-body">
              <tr>
                <td>Status</td>
                <td>
                  {{selectedBook.status}}
                </td>
              </tr>
              <tr>
                <td>Book ID</td>
                <td>{{selectedBook._id}}</td>
              </tr>
              <tr>
                <td>Title</td>
                <td>
                  <input type="text" v-model="selectedBook.title" @input="update('title', $event)" :class="[{'has-error': hasError('title')}]"/>
                  <span class="error-message" v-if="hasError('title', 'required')">Please enter Title</span>
                  <template v-if="isFieldChanged('title')">
                    <button v-if="!isShowOrigField('title')" v-on:click="showOrigField('title', $event)">
                      <i class="fa fa-copy"></i>
                    </button>
                    <template v-if="isShowOrigField('title')">
                      <button v-on:click="revertField('title')">
                        <i class="fa fa-undo"></i>
                      </button>
                      <input type="text" disabled :value="this.selectedBookOrig['title']" />
                      <button v-on:click="hideOrigField('title')">
                        <i class="fa fa-close"></i>
                      </button>
                    </template>
                  </template>
                </td>
              </tr>
              <tr>
                <td>Subtitle</td>
                <td>
                  <input type="text" v-model="selectedBook.subtitle" @input="update('subtitle', $event)"/>
                  <template v-if="isFieldChanged('subtitle')">
                    <button v-if="!isShowOrigField('subtitle')" v-on:click="showOrigField('subtitle', $event)">
                      <i class="fa fa-copy"></i>
                    </button>
                    <template v-if="isShowOrigField('subtitle')">
                      <button v-on:click="revertField('subtitle')">
                        <i class="fa fa-undo"></i>
                      </button>
                      <input type="text" disabled :value="this.selectedBookOrig['subtitle']" />
                      <button v-on:click="hideOrigField('subtitle')">
                        <i class="fa fa-close"></i>
                      </button>
                    </template>
                  </template>
                </td>
              </tr>
              <tr>
                <td :class="[{'has-error': hasError('author')}]">Author</td>
                <td>
                  <template v-for="(author, i) in selectedBook.author" >
                    <input v-model="selectedBook.author[i]" type="text" class="book-author" @input="update('author', $event)">
                    <button v-on:click="removeAuthor(i)" :class="{'disabled': i == 0 && selectedBook.author.length == 1}">
                      <i class="fa fa-minus-circle" ></i>
                    </button>
                  </template>
                  <button v-on:click="addAuthor"><i class="fa fa-plus-circle"></i></button>
                  <template v-if="isFieldChanged('author')">
                    <button v-if="!isShowOrigField('author')" v-on:click="showOrigField('author', $event)">
                      <i class="fa fa-copy"></i>
                    </button>
                    <template v-if="isShowOrigField('author')">
                      <button v-on:click="revertField('author')">
                        <i class="fa fa-undo"></i>
                      </button>
                      <template v-if="selectedBookOrig.author" v-for="(author, i) in selectedBookOrig.author" >
                        <input :value="selectedBookOrig.author[i]" type="text" class="book-author" disabled>
                      </template>
                      <button v-on:click="hideOrigField('author')">
                        <i class="fa fa-close"></i>
                      </button>
                    </template>
                  </template>
                  <span class="error-message" v-if="hasError('author', 'required')">Please enter Author</span>
                </td>
              </tr>
              <tr>
                <td>Category</td>
                <td>

                  <v-select
                    :options="categoriesList"
                    :search="true"
                    :placeholder="'Category'"
                    @options="onCategoryMetaOptions"
                    ref="selectMetaCategory"
                    @change="onCategoryMetaChange"
                    v-model="selectedBook.category"
                    :class="[{'has-error': hasError('category')}]"></v-select>
                  <template v-if="isFieldChanged('category')">
                    <button v-if="!isShowOrigField('category')" v-on:click="showOrigField('category', $event)">
                      <i class="fa fa-copy"></i>
                    </button>
                    <template v-if="isShowOrigField('category')">
                      <button v-on:click="revertField('category')">
                        <i class="fa fa-undo"></i>
                      </button>
                      <input type="text" disabled :value="this.selectedBookOrig['category']" />
                      <button v-on:click="hideOrigField('category')">
                        <i class="fa fa-close"></i>
                      </button>
                    </template>
                  </template>
                  <span class="error-message" v-if="hasError('category', 'required')">Please enter Category</span>
                </td>
              </tr>
              <tr>
                <td>Language</td>
                <td><input type="text" :value="selectedBookLanguage" disabled/></td>
              </tr>
              <tr>
                <td>Narrator</td>
                <td>
                  <template v-if="selectedBook.narrator" v-for="(narrator, i) in selectedBook.narrator" >
                    <input v-model="selectedBook.narrator[i]" type="text" class="book-author" @input="update('narrator', $event)">
                    <button v-on:click="removeNarrator(i)" :class="{'disabled': i == 0 && selectedBook.narrator.length == 1}">
                      <i class="fa fa-minus-circle" ></i>
                    </button>
                  </template>
                  <button v-on:click="addNarrator"><i class="fa fa-plus-circle"></i></button>
                  <template v-if="isFieldChanged('narrator')">
                    <button v-if="!isShowOrigField('narrator')" v-on:click="showOrigField('narrator', $event)">
                      <i class="fa fa-copy"></i>
                    </button>
                    <template v-if="isShowOrigField('narrator')">
                      <button v-on:click="revertField('narrator')">
                        <i class="fa fa-undo"></i>
                      </button>
                      <template v-if="selectedBookOrig.narrator" v-for="(narrator, i) in selectedBookOrig.narrator" >
                        <input :value="selectedBookOrig.narrator[i]" type="text" class="book-author" disabled>
                      </template>
                      <button v-on:click="hideOrigField('narrator')">
                        <i class="fa fa-close"></i>
                      </button>
                    </template>
                  </template>
                </td>
              </tr>
              <tr>
                <td>Translator</td>
                <td>
                  <input type="text" v-model="selectedBook.translator" @input="update('translator', $event)" />
                  <template v-if="isFieldChanged('translator')">
                    <button v-if="!isShowOrigField('translator')" v-on:click="showOrigField('translator', $event)">
                      <i class="fa fa-copy"></i>
                    </button>
                    <template v-if="isShowOrigField('translator')">
                      <button v-on:click="revertField('translator')">
                        <i class="fa fa-undo"></i>
                      </button>
                      <input type="text" disabled :value="this.selectedBookOrig['translator']" />
                      <button v-on:click="hideOrigField('translator')">
                        <i class="fa fa-close"></i>
                      </button>
                    </template>
                  </template>
                </td>
              </tr>
              <tr>
                <td>Translated from</td>
                <td>
                  <input type="text" v-model="selectedBook.transfrom" @input="update('transfrom', $event)" />
                  <template v-if="isFieldChanged('transfrom')">
                    <button v-if="!isShowOrigField('transfrom')" v-on:click="showOrigField('transfrom', $event)">
                      <i class="fa fa-copy"></i>
                    </button>
                    <template v-if="isShowOrigField('transfrom')">
                      <button v-on:click="revertField('transfrom')">
                        <i class="fa fa-undo"></i>
                      </button>
                      <input type="text" disabled :value="this.selectedBookOrig['transfrom']" />
                      <button v-on:click="hideOrigField('transfrom')">
                        <i class="fa fa-close"></i>
                      </button>
                    </template>
                  </template>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <fieldset>
                    <legend>Brief Description</legend>
                    <textarea v-model="selectedBook.description_short" @input="update('description_short', $event)" maxlength="250"
                      :class="[{'has-error': hasError('descirption_short')}]"></textarea>
                    <span class="error-message" v-if="hasError('description_short', 'min_length')">Minimum required length is 100 characters</span>
                    <br>
                    {{selectedBook.description_short ? selectedBook.description_short.length : '0'}}/250
                    <template v-if="isFieldChanged('description_short')">
                      <button v-if="!isShowOrigField('description_short')" v-on:click="showOrigField('description_short', $event)">
                        <i class="fa fa-copy"></i>
                      </button>
                      <template v-if="isShowOrigField('description_short')">
                        <button v-on:click="revertField('description_short')">
                          <i class="fa fa-undo"></i>
                        </button>
                        <textarea disabled :value="this.selectedBookOrig['description_short']" ></textarea>
                        <button v-on:click="hideOrigField('description_short')">
                          <i class="fa fa-close"></i>
                        </button>
                      </template>
                    </template>
                  </fieldset>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <fieldset>
                    <legend>Long Description</legend>
                    <textarea v-model="selectedBook.description" @input="update('description', $event)" maxlength="1500"></textarea>
                    <br>
                    {{selectedBook.description ? selectedBook.description.length : '0'}}/1500
                    <template v-if="isFieldChanged('description')">
                      <button v-if="!isShowOrigField('description')" v-on:click="showOrigField('description', $event)">
                        <i class="fa fa-copy"></i>
                      </button>
                      <template v-if="isShowOrigField('description')">
                        <button v-on:click="revertField('description')">
                          <i class="fa fa-undo"></i>
                        </button>
                        <textarea disabled :value="this.selectedBookOrig['description']" ></textarea>
                        <button v-on:click="hideOrigField('description')">
                          <i class="fa fa-close"></i>
                        </button>
                      </template>
                    </template>
                  </fieldset>
                </td>
              </tr>
            </table>
          </fieldset>

        </div>
      </td>
    </tr>
  </table>
</template>
<script>
  import {mapGetters, mapActions} from 'vuex';
  import LANGUAGES from '../../../static/languages.json';
  import api_config from '../../mixins/api_config';
  import Grid from '../generic/Grid';
  import superlogin from 'superlogin-client';
  import PouchDB from 'pouchdb';
  import { select } from 'vue-strap';
  import BookCoverModal from './BookCoverModal';
  import modal from 'vue-js-modal';
  import Vue from 'vue';
  Vue.use(modal);
  export default {
      name: 'Books',
      data() {
        return {
          metaVisible: false,
          selectedLibrary: {},
          selectedLibraryBooks: [],
          selectedBook: {},
          selectedBookImage: '',
          selectedBookOrig: {},
          filters: {
            libraryId: null, language: null, search: ''
          },
          filtersSearchSuggestions: [],
          searchSet: '',
          repositoryFilters: {
            category: '', allBooks: false
          },
          libraryFilters: {
            category: '', status: ''
          },
          repositoryCategoriesList: ['Stories', 'Verse', 'History', 'Ideas', 'Science'],
          statusList: {'new': 'New', 'published': 'Published', 'unpublished': 'Unpublished'},
          repositoryBooks: [],
          booksGridHeaders: [
            {
              title: 'Book Title',
              path: 'title'
            },
            {
              title: 'Author',
              path: 'author',
              render (val) {
                return val ? val.join(', ') : ''
              }
            },
            {
              title: 'Category',
              path: 'category'
            },
            {
              title: '',
              path: 'allow_add',
              html(val) {
                return val == true ? '<i class="fa fa-arrow-circle-o-right import-book"></i>' : '';
              }
            }
          ],
          libraryBooksGridHeaders: [
            {
              title: 'Book Title',
              path: 'title'
            },
            {
              title: 'Author',
              path: 'author',
              render (val) {
                return val ? val.join(', ') : ''
              }
            },
            {
              title: 'Category',
              path: 'category'
            },
            {
              title: '',
              path: 'status',
              addClass: 'status',
              html(val) {
                return '<span class="status-' + val + '"></span>';
              }
            }
          ],
          showOrig: [],
          searchCategoryMeta: '',
          publishValidationErrors: {}
        };
      },
      mounted() {
        this.setDefaultLibrary();
        this.setDefaultLanguage();
        this.loadRepositoryBooks();
      },
      mixins: [api_config],
      components: {
        'grid': Grid,
        'v-select': select,
        'BookCoverModal': BookCoverModal
      },
      methods: {
        setDefaultLibrary() {
          if (!this.filters.libraryId && this.libraries && this.libraries.length) {
            this.filters.libraryId = this.libraries[0]._id;
          } else if (this.filters.libraryId) {
            this.reloadSelectedLibrary();
          }
        },
        reloadSelectedLibrary() {
          if (this.filters.libraryId && this.libraries) {
            var lib = this.libraries.find(l => l._id == this.filters.libraryId);
            if (lib) {
              this.selectedLibrary = lib;
              this.prepareRepositoryBooks();
            }
          }
        },
        setDefaultLanguage() {
          let langs = this.languagesList;
          let en = langs ? langs.find(l => l.code == 'en') : null;
          if (en) {
            this.filters.language = 'en';
          } else if (langs && langs.length) {
            this.filters.language = langs[0].code;
          }
        },
        prepareRepositoryBooks() {
          if (this.selectedLibrary && this.repositoryBooks) {
            this.repositoryBooks.forEach(b => {
              let lib_book = this.selectedLibrary.books.find(lb => lb.id == b._id);
              if (!lib_book) {
                b.allow_add = true;
              } else {
                b.allow_add = false;
              }
            });
          }
        },
        loadRepositoryBooks() {
          let api_url = this.API_URL + 'books/published';
          let api = this.$store.state.auth.getHttp();
          let self = this;
          api.get(api_url, {}, {}).then(function(response){

            if (response.status===200) {
              self.repositoryBooks = response.data;
              self.prepareRepositoryBooks();
            } else {

            }
          }).catch((err) => {

          });
        },
        clickRowRepositoryBooks(object, event) {
          if (event && event.target && event.target.className.indexOf('import-book') !== -1) {
            //console.log(object);
            let api_url = this.API_URL + 'library/' + this.selectedLibrary._id + '/book';
            let api = this.$store.state.auth.getHttp();
            let self = this;
            api.post(api_url, {
              book_id: object._id
            }, {}).then(function(response){

              if (response.status===200) {
                self.prepareRepositoryBooks();
              } else {

              }
            }).catch((err) => {

            });
          }
        },
        clickRowLibraryBooks(object, event) {
          this.selectedBookImage = '';
          this.selectedBook = object;
          this.loadBookImage();
        },
        loadBookImage() {
          var dbPath = superlogin.getDbUrl('ilm_library_files');
          var db = new PouchDB(dbPath);
          db.getAttachment('lib-' + this.selectedLibrary._id + '-book-' + this.selectedBook._id, 'coverimg')
            .then(attachment => {
              let url = URL.createObjectURL(attachment);
              //console.log(attachment, url);
              this.selectedBookImage = url;
            })
            .catch(err => {
              console.log(err);
            });
        },
        bookImageUpdated() {
          this.loadBookImage();
          if (this.selectedBook._id && this.selectedBook.status === 'published') {
            this.liveUpdate('status', 'unpublished');
          }
        },
        prepareSelectedLibraryBooks() {
          this.selectedLibraryBooks = [];
          if (this.selectedLibrary && this.selectedLibrary.books) {
            this.selectedLibrary.books.forEach(b => {
              var modified_meta = Object.assign({}, b);
              var origMeta = Object.assign({}, b.meta);
              delete modified_meta.id;
              delete modified_meta.meta;
              modified_meta = Object.assign(origMeta, modified_meta);
              this.selectedLibraryBooks.push(modified_meta);
            });
          }
        },
        toggleMetaOpened() {
          this.metaVisible = !this.metaVisible;
        },
        update: _.debounce(function (key, event) {
          this.liveUpdate(key, ['author', 'narrator'].indexOf(key) !== -1 ? this.selectedBook[key] : event.target.value)
        }, 300),
        liveUpdate(key, value) {
          var dbPath = superlogin.getDbUrl('ilm_libraries');
          var db = new PouchDB(dbPath);
          var api = db.hoodieApi();
          return api.find(this.selectedLibrary._id)
            .then(library => {
              let book = library.books.find(b => b.id === this.selectedBook._id);
              if (book && book[key] != value) {
                if (this.publishValidationErrors[key]) {
                  delete this.publishValidationErrors[key];
                }
                book[key] = value;
                if (book['status'] == 'published') {
                  if (book.version) {
                    let ver = book.version.split('.');
                    if (ver && ver.length == 2) {
                      book.version = ver[0] + '.' + (parseInt(ver[1]) + 1);
                    }
                  }
                  book['status'] = 'unpublished';
                }
                let update = {books: library.books};
                return api.update(this.selectedLibrary._id, update).then(doc => {
                    /*return this.updateBookVersion({minor: true})
                      .then(() => {
                        return BPromise.resolve(doc);
                      })
                      .catch(err => {
                        console.log(err);
                        return BPromise.reject(err);
                      });*/
                  }).catch(err => {
                    //console.log('error DB pdate: ', err)
                    console.log(err);
                  })
              }
            });
        },
        addAuthor() {
          if (!this.selectedBook.author) {
            this.selectedBook.author = [];
          }
          this.selectedBook.author.push('');
          this.liveUpdate('author', this.selectedBook.author);
        },
        removeAuthor(i) {
          if (i > 0 || this.selectedBook.author.length > 1) {
            this.selectedBook.author.splice(i, 1);
            this.liveUpdate('author', this.selectedBook.author);
          }
        },
        addNarrator() {
          if (!this.selectedBook.narrator) {
            this.selectedBook.narrator = [];
          }
          this.selectedBook.narrator.push('');
          this.liveUpdate('narrator', this.selectedBook.narrator);
        },
        removeNarrator(i) {
          if (i > 0 || this.selectedBook.narrator.length > 1) {
            this.selectedBook.narrator.splice(i, 1);
            this.liveUpdate('narrator', this.selectedBook.narrator);
          }
        },
        isFieldChanged(f) {
          if (this.selectedBook._id) {
            return this.selectedBook[f] !== this.selectedBookOrig[f];
          } else {
            return false;
          }
        },
        showOrigField(f, event) {
          if (this.showOrig.indexOf(f) === -1) {
            this.showOrig.push(f);
          }
        },
        isShowOrigField(f) {
          return this.showOrig.indexOf(f) !== -1;
        },
        revertField(f) {
          var dbPath = superlogin.getDbUrl('ilm_libraries');
          var db = new PouchDB(dbPath);
          var api = db.hoodieApi();
          return api.find(this.selectedLibrary._id)
            .then(library => {
              let book = library.books.find(b => b.id === this.selectedBook._id);
              if (book) {
                if (this.publishValidationErrors[f]) {
                  delete this.publishValidationErrors[f];
                }
                delete book[f];
                return api.update(this.selectedLibrary._id, {books: library.books}).then(doc => {
                  this.hideOrigField(f);
                  }).catch(err => {
                    console.log(err);
                  })
              }
            });
        },
        hideOrigField(f) {
          let index = this.showOrig.indexOf(f);
          if (index !== -1) {
            this.showOrig.splice(index, 1);
          }
        },
        onCategoryMetaOptions() {
          if (this.$refs.selectMetaCategory) {
            let self = this;
            $(this.$refs.selectMetaCategory.$refs.search).on('input', function() {
              self.searchCategoryMeta = $(this).val();
            });
          }
          //console.log(arguments);
        },
        onCategoryMetaChange(val) {
          let shortList = this.categoriesListShort;
          if (shortList.indexOf(val) === -1) {
            val = val.replace(/ \(new\)$/, '');
          }
          if (this.$refs.selectMetaCategory) {
            //console.log('HERE');
            $(this.$refs.selectMetaCategory.$refs.search).val('').trigger('change');
          }
          this.liveUpdate('category', val);
        },
        showBookCoverModal() {
          this.$refs.bookCoverModal.show();
        },
        removeBookFromLibrary() {
          if (this.selectedLibrary._id && this.selectedBook._id) {
            let api_url = this.API_URL + 'library/' + this.selectedLibrary._id + '/book/' + this.selectedBook._id;
            let api = this.$store.state.auth.getHttp();
            let self = this;
            api.delete(api_url, {}, {}).then(function(response){

              if (response.status===200) {
                self.selectedBook = {};
                self.prepareRepositoryBooks();
              } else {

              }
            }).catch((err) => {

            });
          }
        },
        modalOpened() {
          $('.fixed-wrapper .navtable').css('z-index', 0);
          $('.nav-tabs-wrapper').css('z-index', 0);
          $('.toolbar-wrapper .toolbar').css('z-index', 0);
        },
        modalClosed() {
          $('.fixed-wrapper .navtable').css('z-index', 999);
          $('.nav-tabs-wrapper').css('z-index', 999);
          $('.toolbar-wrapper .toolbar').css('z-index', 999);
        },
        showModal(name) {
          this.$modal.show(name);
        },
        hideModal(name) {
          this.$modal.hide(name);
        },
        publish() {
          if (this.selectedLibrary._id && this.selectedBook._id) {
            let api_url = this.API_URL + 'library/' + this.selectedLibrary._id + '/book/' + this.selectedBook._id + '/publish';
            this.publishValidationErrors = {};
            let api = this.$store.state.auth.getHttp();
            let self = this;
            api.post(api_url, {}, {}).then(function(response){

              if (response.status===200) {
                if (response && response.data && response.data.errors) {
                  self.publishValidationErrors = response.data.errors;
                } else {
                  self.showModal('on-published-modal');
                }
              } else {
                console.log(response);
              }
            }).catch((err) => {
              console.log(err);
            });
          }
        },
        hasError(field, error) {
          let exists = typeof this.publishValidationErrors[field] !== 'undefined';
          if (!exists) {
            return false;
          } else {
            if (error) {
              return typeof this.publishValidationErrors[field][error] !== 'undefined'
            } else {
              return true;
            }
          }
        },
        unpublish() {
          if (this.selectedBook._id && this.selectedBook.status === 'published') {
          var dbPath = superlogin.getDbUrl('ilm_libraries');
          var db = new PouchDB(dbPath);
          var api = db.hoodieApi();
          return api.find(this.selectedLibrary._id)
            .then(library => {
              let book = library.books.find(b => b.id === this.selectedBook._id);
              if (book) {
                book.status = 'unpublished';
                book.publishedVersion = null;
                return api.update(this.selectedLibrary._id, {books: library.books}).then(doc => {
                  this.hideModal('on-unpublish-modal');
                  }).catch(err => {
                    console.log(err);
                  });
              }
            });
          }
        },
        addFilterSuggestion(value) {
          let existing = this.filtersSearchSuggestions.find(s => s.value == value);
          if (!existing) {
            this.filtersSearchSuggestions.push({value: value, label: value.replace(new RegExp('(' + this.filters.search + ')', 'i'), '<b>$1</b>')});
          }
        },
        setSearch(value) {
          this.searchSet = value;
          this.filters.search = value;
        }
      },
      computed: {
        languagesList() {
          if (this.isAdmin) {
            return LANGUAGES;
          } else {
            if (this.user.languages) {
              return LANGUAGES.filter(l => this.user.languages.indexOf(l.code) !== -1);
            } else {
              return [];
            }
          }
        },
        allLibrariesList() {
          return this.libraries.filter(l => !!l.title);
        },
        repositoryBooksList() {
          let list = this.repositoryBooks;
          if (this.filters.language) {
            list = list.filter(l => l.language == this.filters.language);
          }
          if (this.filters.search) {
            list = list.filter(l => {
              let filter = this.filters.search.toLowerCase();
              let match = l.title.toLowerCase().indexOf(filter) !== -1;
              if (match) {
                this.addFilterSuggestion(l.title);
              }
              l.author.forEach(a => {
                let match_author = a.toLowerCase().indexOf(filter) !== -1;
                if (match_author) {
                  this.addFilterSuggestion(a);
                  if (!match) {
                    match = match_author;
                  }
                }
              });
              return match;
            });
          }
          if (this.repositoryFilters.category) {
            list = list.filter(l => l.category == this.repositoryFilters.category);
          }
          return list;
        },
        libraryBooksList() {
          let list = this.selectedLibraryBooks;
          if (this.filters.language) {
            list = list.filter(l => l.language == this.filters.language);
          }
          if (this.filters.search) {
            let search = this.filters.search.toLowerCase();
            list = list.filter(l => {
              let match = l.title.toLowerCase().indexOf(search) !== -1;
              if (match) {
                this.addFilterSuggestion(l.title);
              }
              l.author.forEach(a => {
                let match_author = a.toLowerCase().indexOf(search) !== -1;
                if (match_author) {
                  this.addFilterSuggestion(a);
                  if (!match) {
                    match = match_author;
                  }
                }
              });
              return match;
            });
          }
          if (this.libraryFilters.category) {
            list = list.filter(l => l.category == this.libraryFilters.category);
          }
          if (this.libraryFilters.status) {
            list = list.filter(l => l.status == this.libraryFilters.status);
          }
          return list;
        },
        selectedBooks: {
          get() {
            return this.selectedBook._id ? [this.selectedBook._id] : [];
          }
        },
        selectedBookLanguage: {
          get() {
            if (this.selectedBook && this.selectedBook.language) {
              let l = LANGUAGES.find(_l => _l.code == this.selectedBook.language);
              if (l) {
                return l.name;
              }
            }
          }
        },
        categoriesList() {
          let categoriesList = [];
          if (this.selectedLibraryBooks) {
            this.selectedLibraryBooks.forEach(b => {
              if (categoriesList.indexOf(b.category) === -1) {
                categoriesList.push(b.category)
              }
            })
          }
          if (this.searchCategoryMeta && categoriesList.indexOf(this.searchCategoryMeta) === -1) {
            categoriesList.unshift(this.searchCategoryMeta + ' (new)');
          }
          return categoriesList;
        },
        categoriesListShort() {
          let categoriesList = [];
          if (this.selectedLibraryBooks) {
            this.selectedLibraryBooks.forEach(b => categoriesList.push(b.category))
          }
          return categoriesList.filter((e, i, l) => i === l.indexOf(e));
        },
        ...mapGetters(['libraries', 'isAdmin', 'user'])
      },
      watch: {
        'libraries': {
          handler(val) {
            this.setDefaultLibrary();
            this.prepareSelectedLibraryBooks();
            if (this.selectedLibraryBooks && this.selectedBook._id) {
              let b = this.selectedLibraryBooks.find(_b => _b._id === this.selectedBook._id);
              if (b) {
                //console.log(b);
                this.selectedBook = Object.assign({}, b);
              }
            }
          },
          deep: true
        },
        'filters.libraryId': {
          handler(val) {
            this.reloadSelectedLibrary();
          }
        },
        'filters.search': {
          handler(val) {
            this.filtersSearchSuggestions = [];
            if (this.searchSet != val) {
              this.searchSet = '';
            }
          }
        },
        'selectedLibrary': {
          handler(val, oldVal) {
            if (val._id != oldVal._id) {
              this.selectedBook = {};
              this.metaVisible = false;
            }
            if (val && val._id) {
              this.prepareSelectedLibraryBooks();
            }
          }
        },
        'languagesList': {
          handler(val) {
            this.setDefaultLanguage();
          }
        },
        'selectedBook': {
          handler(val) {
            if (this.selectedBook._id) {
              let b = this.selectedLibrary.books.find(_b => _b.id == this.selectedBook._id);
              if (b) {
                this.selectedBookOrig = Object.assign({}, b.meta);
              }
            } else {
              this.selectedBookOrig = {};
              this.selectedBookImage = '';
              this.metaVisible = false;
            }
          }
        },
        'searchCategoryMeta': {
          handler(val) {
            ;
          }
        },
        'filters': {
          handler(val) {
            if (this.selectedBook._id) {
              this.selectedBook = {};
            }
          },
          deep: true
        },
        'libraryFilters': {
          handler(val) {
            if (this.selectedBook._id) {
              this.selectedBook = {};
            }
          },
          deep: true
        },
        'libraryBooksList': {
          handler(val) {
            setTimeout(function() {
              $('.library-books-grid tr').each(function() {
                if ($(this).find('span.status-new, span.status-unpublished').length) {
                  $(this).find('td').addClass('grayed-out');
                } else {
                  $(this).find('td').removeClass('grayed-out');
                }
              });
            }, 500);
          },
          deep: true
        }
      }
  }
</script>
<style lang="less">
  .library-books {
    width: 100%;
    .library-books-toolbar {
      margin-top: 45px;
      z-index: 999;
      background-color: white;
      width: 100%;
      select {
        max-width: 200px;
        display: inline-block;
        margin: 0px 20px 0px 10px;
      }
      label {
        display: inline-block;
        margin: 0px 0px 0px 20px;
      }
      .search-wrapper {
        position: relative;
        display: inline-block;
        input.search {
          border-radius: 8px;
          border: 2px solid silver;
          display: inline-block;
          padding: 1px 4px;
          position: relative;
          &.has-autocomplete {
            border-radius: 8px 8px 0px 0px;
          }
        }
        .search-autocomplete {
          position: absolute;
          border: 1px solid silver;
          width: 100%;
          padding: 2px 3px;
          z-index: 9999;
          background-color: white;
          & > div {
            cursor: pointer;
            &:not(.no-items):hover {
              background-color: #ece9e9;
            }
          }
        }
      }
    }
    tr.grids {
      vertical-align: top;
      &>td:not(.meta-container) {
        width: 40%;
        padding: 0px 10px;
        border: 1px solid silver;
        &.grid-cell {
          vertical-align: middle;
        }
        &.noData {
          vertical-align: middle;
        }
      }
      &.grids-3 {
        &>td {
          width: 30%;
        }
      }
      tr.selected {
        background-color: darkseagreen;
      }
    }
    .library-books-wrapper {
      position: relative;
    }
    .books-grid {
      width: 97%;
      tr {
        height: 45px;
        th {
          height: 45px;
          padding: 2px 5px;
          background-color: silver;
          border: 1px solid #ddd;
          vertical-align: middle !important;
          &.status {
            display: none;
          }
        }
        td {
          &.status {
            display: none;
          }
          &.grayed-out {
            color: #9e9e9e;
          }
        }
        &.selected {
          td {
            &.grayed-out {
              color: #545454;
            }
          }
        }

      }
    }
    select {
      padding: 3px;
      height: 34px;
    }
    .toggle-meta {
      background-color: black;
      color: white;
      border-radius: 12px;
      width: 18px;
      height: 18px;
      text-align: center;
      display: inline-block;
      top: 0px;
      position: absolute;
      left: 97%;
    }
    .meta-wrapper {
      position: fixed;
      /*min-width: 450px;*/
      overflow-y: scroll;
      width: 30%;
      height: 70%;
    }
    .meta-header {
      tr {
        border: none;
        td {
          border: none;
          &.img-container {
            width: 20%;
            padding: 0px 4px;
          }
          .btn {
            font-size: 10px;
            display: inline-block;
          }
          .cover-image {
            cursor: pointer;
          }
          img.cover-image {
            width: 80px;
          }
          div.cover-image {
            width: 80px;
            height: 80px;
            background-color: white;
            border-left: 1px solid silver;
            border-right: 1px solid silver;
          }
        }
      }
    }
    .meta-body {
      width: 100%;
      tr {
        padding: 2px 0px;
      }
      tr:nth-child(odd) {
        background-color: #F0F0F0;
      }
      td:nth-child(1) {
        width: 100px;
      }
      td {
        padding: 4px 0px;
        input[type="text"] {
          width: 85%;
          &.book-author {
            width: 60%;
          }
        }
        button {
          border: none;
          background-color: inherit;
        }
        input.has-error, textarea.has-error {
          border: 1px solid red;
        }
        span.error-message {
          color: red;
          margin: 0px;
          display: block;
        }
        td.error-message {
          color: red;
        }
      }
    }
    fieldset {
      border: solid 1px gray;
      legend {
        font-size: 12px;
        margin: 0px;
        width: auto;
      }
      textarea {
        height: 100px;
        width: 90%;
        resize: none;
      }
    }
  }
</style>
