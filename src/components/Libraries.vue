<template>
  <div class="area-wrapper">
  <vue-tabs @tab-change="onTabChange" ref="tabs" :class="'libraries-tabs'">
    <vue-tab title="Administer libraries" v-if="isAdmin">
      <table class="libraries-list">
        <tr class="toolbar-container">
          <td class="">
            <div class="table toolbar">
              <div class="tr">
                <div class="td">
                  <h3>{{header}}</h3>
                </div>
                <div class="td pull-right">
                  <button class='btn btn-primary' v-on:click="create()">
                    <i class="fa fa-plus"></i>&nbsp;Add New Library
                  </button>
                </div>
              </div>
            </div>
          </td>
          <td v-if="metaOpened" rowspan="2" class="library-info">
            <div class="sidebar">
              <div class="table">
                <div class="tr">
                  <div class="td">
                    <label>Library name</label>
                  </div>
                </div>
                <div class="tr">
                  <div class="td">
                    <input type="text" @input="update('title', $event)" class="library-title" v-model="library.title"/>
                  </div>
                  <div class="td">
                    <button class="btn btn-danger pull-right" v-on:click="showModal('on-collection-remove-message')" :disabled="!allowDeleteLibrary">Delete Library</button>
                  </div>
                </div>
                <div class="tr">
                  <div class="td">
                    <h3>Librarians</h3>
                  </div>
                  <div class="td">
                    <button class="btn btn-primary pull-right" :disabled="allowedLibrarians.length == 0" v-on:click="addLibrarian()">Add Librarian</button>
                  </div>
                </div>
              </div>
              <div v-if="!library.librarians || library.librarians.length == 0">No Librarians</div>
              <div v-else>
                <table class="api-keys-grid">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Languages</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="librarian in library.librarians">
                      <td>
                        <select v-if="!librarian.id" class="form-control" v-model="librarian.id" @change="updateLibrarian()">
                          <option></option>
                          <option v-for="lib in allowedLibrarians" :value="lib._id">{{lib.name}}</option>
                        </select>
                        <span v-else :class="{'disabled': isLibrarianDisabled(librarian)}">{{librarian.name}}</span>
                      </td>
                      <td>
                        <v-select :options="langsForLibrarian(librarian)"
                          options-label="name"
                          options-value="code"
                          multiple
                          v-model="librarian.langs"
                          @change="updateLibrarianLanguages(librarian, $event)">

                        </v-select>
                      </td>
                      <td>
                        <button class="btn btn-danger" v-on:click="removeLibrarian(librarian)">Remove</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="table">
                <div class="tr">
                  <div class="td">
                    <h3>API keys</h3>
                  </div>
                  <div class="td">
                    <button class="btn btn-primary pull-right" v-on:click="addKey()">Add API Key</button>
                  </div>
                </div>
              </div>
              <div v-if="!library.api_keys || library.api_keys.length == 0">No API keys</div>
              <div v-if="library.api_keys && library.api_keys.length > 0">
                <table class="api-keys-grid">
                  <thead>
                    <tr>
                      <th>Subscriber</th>
                      <th>API key</th>
                      <th>Actions</th>
                      <th>Created</th>
                      <th>Request Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="key in library.api_keys">
                      <td>
                        <input type="text" v-model="key.subscriber" @input="updateKey()"/>
                      </td>
                      <td>
                        <button class="btn btn-default" v-on:click="showKey(key)" v-if="key.key.length">Show</button>
                      </td>
                      <td>
                        <button v-if="!key.key.length" class="btn btn-primary" v-on:click="generateKey(key)">Generate</button>
                        <template v-else>
                          <button class="btn btn-danger" v-if="key.enabled" v-on:click="enableKey(key)">Disable</button>
                          <button class="btn btn-primary" v-else v-on:click="enableKey(key)">Enable</button>
                        </template>
                      </td>
                      <td>
                        {{dateFormated(key.created_at, 'd F Y')}}
                      </td>
                      <td class="requests-count">
                        {{key.requests_count}}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </td>
        </tr>
        <tr>
          <td class="libraries-grid-container">
            <grid id="books_grid"
              :data="libraries"
              :columns="gridHeaders"
              :rowsPerPage="100"
              :idField="idField"
              @clickRow="clickRow"
              :customEmptyTableText="'No libraries'"
              :class="'libraries-grid'"
              :selected="selectedLibraries">
            </grid>
            <i :class="['fa', 'toggle-meta', {'fa-chevron-left': !metaOpened}, {'fa-chevron-right': metaOpened}]" v-on:click="toggleMetaOpened()" v-if="currentLibrary._id"></i>
          </td>
        </tr>
      </table>
      <modal name="on-collection-remove-message" :height="150" :resizeable="false">
        <div class="modal-header"></div>
        <div class="modal-body">
          <p>Delete {{library.title}} Library?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" v-on:click="hideModal('on-collection-remove-message')">Cancel</button>
          <button class="btn btn-primary" v-on:click="removeLibrary()">Delete</button>
        </div>
      </modal>
      <modal name="api-key-info" :height="320" :resizeable="false">
        <div class="modal-header">API key</div>
        <div class="modal-body">
          <div class="table">
            <div class="tr">
              <div class="td">
                Subscriber
              </div>
              <div class="td">
                <input type="text" disabled :value="selectedKey.subscriber" />
              </div>
            </div>
            <div class="tr">
              <div class="td">
                API key
              </div>
              <div class="td">
                <input type="text" disabled :value="selectedKey.key" ref="selectedKey_key" />
                <a class="copy-key" v-on:click="copyKey(selectedKey.key, $event)">Copy</a>
              </div>
            </div>
            <div class="tr">
              <div class="td">
                Created
              </div>
              <div class="td">
                <input type="text" disabled :value="dateFormated(selectedKey.created_at, 'd F Y')" />
              </div>
            </div>
            <div class="tr">
              <div class="td">
                Request Count
              </div>
              <div class="td">
                <input type="text" disabled :value="selectedKey.requests_count" />
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" v-on:click="hideModal('api-key-info')">Close</button>
        </div>
      </modal>
    </vue-tab>
    <vue-tab title="Library Books">
      <library-books></library-books>
    </vue-tab>
    <vue-tab title="Library Collections">
      <div>
        <h1>{{ msg }}</h1>
      </div>
    </vue-tab>
  </vue-tabs>
  </div>
  <!--<div class="area-wrapper">-->
</template>

<script>
  import {VueTabs, VTab} from 'vue-nav-tabs';
  import Grid from './generic/Grid';
  import {mapGetters, mapActions} from 'vuex';
  import superlogin from 'superlogin-client';
  import Vue from 'vue';
  import PouchDB from 'pouchdb';
  import v_modal from 'vue-js-modal';
  import api_config from '../mixins/api_config';
  import {dateFormat} from '@src/filters';
  import { select } from 'vue-strap';
  import LANGUAGES from '../../static/languages.json';
  var hat = require('hat');
  Vue.use(v_modal, { dialog: true });
  import Books from './libraries/Books';
  export default {
    name: 'Libraries',
    data() {
      return {
        msg: 'Libraries',
        metaOpened: false,
        library: {},
        gridHeaders: [
          {
            title: 'Title',
            path: 'title',
            addClass: 'title'
          },
          {
            title: 'Published books',
            path: 'published_books',
            addClass: 'published-books'
          },
          {
            title: 'Total books',
            path: 'books',
            render (val) {
              return val ? val.length : 0;
            }
          },
          {
            title: 'Librarians',
            path: 'active_librarians',
            render (val) {
              //console.log(this, val);
              return val ? val : 0
            }
          },
          {
            title: 'Subscribers',
            path: 'enabled_api_keys',
            render(val) {
              //console.log(this, val);
              return val ? val : 0
            }
          }
        ],
        idField: '_id',
        selectedLibraries: [],
        selectedKey: {},
        allLibrarians: []
      }
    },
    components: {
      'vue-tabs': VueTabs,
      'vue-tab': VTab,
      'grid': Grid,
      'v-select': select,
      'library-books': Books
    },
    mixins: [api_config],
    methods: {
      init() {
        if (this.currentLibrary) {
          this.library = Object.assign({}, this.currentLibrary);
        } else {
          this.library = {};
        }
        this.loadLibrarians();
        if (this.$store.state.route.path.indexOf('/library-books') === -1 && this.$store.state.route.path.indexOf('/library-collections') === -1 && !this.isAdmin) {
          this.$router.replace({path: '/library-books'});
        }
      },
      onTabChange(index, tabTo, tabFrom) {
        if (index === 0) {
          this.$router.replace({ path: '/libraries'});
        } else if (index === 1) {
          this.$router.replace({ path: '/library-books'});
        }
      },
      create() {
        var dbPath = superlogin.getDbUrl('ilm_libraries');
        var db = new PouchDB(dbPath);
        return db.post({
          books: [],
          collections: [],
          state: 'unpublished',
          title: '',
          language: 'en',
          description: '',
          librarians: [],
          api_keys: []
        }).then(doc => {
          let self = this;
          Vue.nextTick(() => {
            self.$emit('libraryAdded', doc.id)
            //self.updateLibrariesList();
            self.onLibraryAdded(doc.id);
          });
        }).catch(err => {
        })
      },
      toggleMetaOpened() {
        this.metaOpened = !this.metaOpened;
      },
      clickRow(library) {
        this.selectedLibraries = [library._id];
        this.selectLibrary(library._id);
      },
      clickRowApiKeys(key, event) {
        console.log(key, event);
      },
      onLibraryAdded(id) {
        if (this.currentLibrary._id !== id) {
          this.$store.commit('SET_CURRENT_LIBRARY', {});
          this.selectLibrary(id);
          this.metaOpened = true;
        }
      },
      selectLibrary(id) {
        if (this.currentLibrary._id !== id) {
          this.loadLibrary(id);
          this.$router.replace({ path: '/libraries/' + id });
        }
      },
      update: _.debounce(function (key, event) {
        this.liveUpdate(key, event.target.value)
      }, 300),
      updateKey: _.debounce(function (key, event) {
        this.liveUpdate('api_keys', this.library.api_keys)
      }, 300),
      change(field) {
        this.liveUpdate(field, this.library[field]);
      },
      updateLibrarian() {
        this.liveUpdate('librarians', this.library.librarians);
      },
      updateLibrarianLanguages(librarian, values) {
        if (!librarian.langs || librarian.langs.length !== values.length) {
          librarian.langs = values;
          this.updateLibrarian();
        }
      },
      liveUpdate(field, value) {
        var dbPath = superlogin.getDbUrl('ilm_libraries')
        var db = new PouchDB(dbPath)
        this.library[field] = value;
        this.library.librarians.forEach(l => {
          if (typeof l.name !== 'undefined') {
            delete l.name;
          }
        });
        return db.put(this.library)
          .then(doc => {

          }).catch(err => {

          })
      },
      showModal(name) {
        this.$modal.show(name);
      },
      hideModal(name) {
        this.$modal.hide(name);
      },
      removeLibrary() {
        let api_url = this.API_URL + 'library/' + this.currentLibrary._id;
        let api = this.$store.state.auth.getHttp();
        let self = this;
        api.delete(api_url, {}, {}).then(function(response){
          self.hideModal('on-collection-remove-message');
          if (response.status===200) {
            self.$router.replace({ path: '/libraries' });
            self.metaOpened = false;
          } else {

          }
        }).catch((err) => {
          self.hideModal('on-collection-remove-message');
        });
      },
      showKey(item) {
        this.selectedKey = item;
        this.showModal('api-key-info');
      },
      dateFormated(date, format) {
        return dateFormat(date, format);
      },
      copyKey(key, event) {
        $(this.$refs.selectedKey_key).removeAttr('disabled');
        var span = $(this.$refs.selectedKey_key)[0];
        span.select();
        document.execCommand("Copy");
        $(this.$refs.selectedKey_key).attr('disabled', true);
      },
      addKey() {
        this.library.api_keys = this.library.api_keys || [];
        var dt = new Date();
        this.library.api_keys.push({subscriber: '', key: '', enabled: false, requests_count: 0, created_at: this.dateFormated(dt, 'Y-m-d H:i:s')})
        this.liveUpdate('api_keys', this.library.api_keys);
      },
      generateKey(key) {
        if (key) {
          key.key = hat();
          this.liveUpdate('api_keys', this.library.api_keys);
        }
      },
      enableKey(key) {
        if (key) {
          key.enabled = key.enabled === false;
          this.liveUpdate('api_keys', this.library.api_keys);
        }
      },
      loadLibrarians() {
        if (this.isAdmin) {
          let api_url = this.API_URL + 'users?' + (new Date).toString();
          let api = this.$store.state.auth.getHttp();
          let self = this;
          api.get(api_url, {}, {}).then(function(response){
            if (response.status===200) {
              let librarians = response.data.filter(u => {
                return u.roles.indexOf('librarian') !== -1;
              });
              self.allLibrarians = librarians;
              self._setLibrarians();
            } else {

            }
          }).catch((err) => {
            self.hideModal('on-collection-remove-message');
          });
        }
      },
      addLibrarian() {
        this.library.librarians = this.library.librarians || [];
        this.library.librarians.push({langs: [], id: null})
        this.liveUpdate('librarians', this.library.librarians);
      },
      _setLibrarians() {
        if (this.currentLibrary && this.currentLibrary.librarians && this.allLibrarians) {
          this.currentLibrary.librarians.forEach(l => {
            var libr = this.allLibrarians.find(al => {
              return al._id == l.id;
            });
            if (libr) {
              l.name = libr.name;
            }
          });
        }
      },
      langsForLibrarian(librarian) {
        let langs = [];
        let libr = this.allLibrarians.find(l => l._id == librarian.id);
        if (libr) {
          libr.languages.forEach(l => {
            let lang = LANGUAGES.find(_l => _l.code == l);
            if (lang) {
              langs.push(lang);
            }
          });
        }
        return langs;
      },
      isLibrarianDisabled(librarian) {
        if (!librarian.langs || librarian.langs.length == 0) {
          return true;
        } else {
          let libr = this.allLibrarians.find(l => l._id == librarian.id);
          if (libr) {
            //console.log(libr);
            return !libr.enable;
          }
        }
        return true;
      },
      removeLibrarian(librarian) {
        this.library.librarians.forEach((l, i) => {
          if (l.id === librarian.id) {
            this.library.librarians.splice(i, 1);
            this.liveUpdate('librarians', this.library.librarians);
          }
        });
      },
      prepareLibrariesList() {
        this.libraries.forEach(l => {
          let enabled_api = 0;
          let active_librarian = 0;
          let published_books = 0;
          if (l.api_keys) {
            l.api_keys.forEach(k => {
              if (k.enabled) {
                ++enabled_api;
              }
            });
          }
          if (l.librarians) {
            l.librarians.forEach(_l => {
              if (!this.isLibrarianDisabled(_l)) {
                ++active_librarian;
              }
            });
          }
          l.books.forEach(b => {
            if (l.published == true) {
              ++published_books;
            }
          });
          l.enabled_api_keys = enabled_api;
          l.active_librarians = active_librarian;
          l.published_books = published_books;
        });
      },
      ...mapActions(['updateLibrariesList', 'loadLibrary'])
    },
    mounted() {
      if (this.$store.state.route.path.indexOf('/library-books') !== -1) {
        this.$refs.tabs.findTabAndActivate('Library Books');
      }
      if (this.$route.params.hasOwnProperty('libraryid')) {
          this.loadLibrary(this.$route.params.libraryid);
      }
      this.init();
    },
    computed: {
      header: {
        get() {
          let count = this.libraries.length;
          return count + ' ' + (count == 1 ? 'Library' : 'Libraries')
        }
      },
      allowedLibrarians: {
        get() {
          let librarians = [];
          this.allLibrarians.forEach(l => {
            let _l = false;
            if (this.library.librarians) {
              _l = this.library.librarians.find(libr => libr.id == l._id);
            }
            if (!_l) {
              librarians.push(l);
            }

          });
          return librarians;
        }
      },
      allowDeleteLibrary() {
        if (this.library) {
          if (!this.library.api_keys || this.library.api_keys.length == 0 ) {
            return true;
          }
          let enabled_api_keys = 0;
          this.library.api_keys.forEach(k => {
            if (k.key && k.enabled) {
              ++enabled_api_keys;
            }
          });
          return enabled_api_keys == 0;
        }
        return false;
      },
      ...mapGetters(['libraries', 'currentLibrary', 'isAdmin'])
    },
    watch: {
      'currentLibrary': {
        handler(val) {
          if (!val || !val._id) {
            //this.metaOpened = false;
          } else {
            //this.metaOpened = true;
            this.selectedLibraries = [this.currentLibrary._id];
            this._setLibrarians();
          }
          this.init();
        }
      },
      'libraries': {
        handler(val) {
          this.prepareLibrariesList();
        },
        deep: true
      },
      'allLibrarians': {
        handler(val) {
          this.prepareLibrariesList();
        },
        deep: true
      }
    }
  }
</script>


<style lang="less">
  .libraries-tabs {
    .nav-tabs-wrapper {
      /*position: fixed;*/
      height: 3em;
      /*z-index: 999;*/
      width: 100%;
      background-color: white;
    }
  }
</style>

<style lang="less" scoped>

  .libraries-list {
    width: 100%;
    .toolbar-container {
      height: 7em;
      .toolbar {
       /* position: fixed;*/
        margin-top: -45px;
        /*z-index: 999;*/
        background-color: white;
      }
    }
  }
  .library-info {
    width: 30%;
    vertical-align: top;
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
  }
  .libraries-grid-container {
    position: relative;
    padding: 0px;
    .libraries-grid {
      width: 98%;
      display: inline-block;
    }
  }
  .sidebar {
    padding: 0px;
    position: fixed;
    overflow-y: scroll;
    height: 80%;
    padding-top: 100px;
    width: 30%;
  }
  .library-title {
    width: 100%;
  }
  .api-keys-grid {
    width: 100%;
    th {
      font-size: 12px;
      background-color: silver;
      border: 1px solid #ddd;
    }
    td {
      font-size: 12px;
      padding: 3px 2px;
      button {
        font-size: 12px;
        width: 100%;
      }
      &.requests-count {
        text-align: right;
      }
      span.disabled {
        color: gray;
      }
    }
  }
  .modal-body {
    .table {
      .td {
        input[type="text"] {
          width: 80%;
        }
        .copy-key {
          cursor: pointer;
        }
      }
    }
  }
</style>
