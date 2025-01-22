<template>
  <div class="authors-list">
    <modals-container></modals-container>
    <v-dialog :clickToClose="false"/>
    <div class="authors-filter">
      <div class="author-filter">
        <div class="filter-label">
          <!-- <label>Language</label> -->
        </div>
        <div class="filter-field">
          <!-- <select v-model="filters.lang">
            <option v-for="(lang, lang_key) in langList" :value="lang_key">{{ lang }}</option>
          </select> -->
          <select-languages
            :placeholder="'Language'"
            :selected="filters.lang ? filters.lang : []"
            @select="applyFilter('lang', $event)"></select-languages>
        </div>
      </div>
      <div class="author-filter">
        <div class="filter-label">
          <!-- <label>Author / Slug</label> -->
        </div>
        <div class="filter-field">
          <input type="text" placeholder="Author / Slug" v-on:keyup="applyFilter('name', $event.target.value)" />
        </div>
      </div>
      <button class="btn btn-primary" v-on:click="addAuthor()">
        <i class="fa fa-plus"></i>&nbsp;Add Author
      </button>
    </div>
    <div class="all-authors">
      <table>
        <thead>
          <tr>
            <th></th>
            <th>Author Name (Verified)</th>
            <th>Author Slug</th>
            <th>Author Name (Alternative)</th>
            <th class="-action"></th>
          </tr>
        </thead>
        <template v-for="author in authorsList">
          <tr :class="['author', '-author-' + cleanId(author.id), {'-closed': !isAuthorOpened(author.id)}, {'-opened': isAuthorOpened(author.id)}]" v-on:dblclick="edit(author)">
            <td>
              <!-- {{ langList[author.language] }} -->
              <i class="fa fa-plus" v-on:click="toggleNameLang(author)"></i>
              <i class="fa fa-minus" v-on:click="toggleNameLang(author)"></i>
            </td>
            <td>{{ author.name }}<template v-if="author.verified_names.length > 0">, {{ author.verified_names.join(", ") }}</template></td>
            <td :class="['author-slug', {'-manual': author.manual_slug}]">{{ author.slug }}</td>
            <td>{{ author.alt_names.join(`, `) }}</td>
            <td>
              <div class="author-action -edit">
                <i class="fa fa-pencil" v-on:click="edit(author)"></i>
              </div>
              <div class="author-action -remove">
                <i class="fa fa-trash" v-on:click="remove(author.id)"></i>
              </div>
            </td>
          </tr>
          <tr :class="['author-name-lang', '-author-' + cleanId(author.id), {'-closed': !isAuthorOpened(author.id)}, '-name-lang-header']">
            <td></td>
            <td>Book Language</td>
            <td>Author Name (Verified)</td>
            <td>Author Name (Alternative)</td>
            <td></td>
          </tr>
          <tr :class="['author-name-lang', '-author-' + cleanId(author.id), {'-closed': !isAuthorOpened(author.id)}]" v-for="nameLang in author.name_lang" v-on:dblclick="editNameLang(author, nameLang)">
            <td></td>
            <td>{{ langList[nameLang.language] }}</td>
            <td>{{ [nameLang.name].concat(nameLang.verified_names.filter(nameLang => {
              return nameLang && nameLang.length > 0;
            })).join(', ') }}</td>
            <td>{{ nameLang.alt_names.join(', ') }}</td>
            <td>
              <div class="author-action -edit">
                <i class="fa fa-pencil" v-on:click="editNameLang(author, nameLang)"></i>
              </div>
              <div class="author-action -remove">
                <i class="fa fa-trash" v-on:click="removeNameLang(author, nameLang.language)"></i>
              </div>
            </td>
          </tr>
          <tr :class="['author-name-lang', '-author-' + cleanId(author.id), {'-closed': !isAuthorOpened(author.id)}]">
            <td colspan="4">
              <button class="btn btn-primary" v-on:click="addNameLang(author)">
                <i class="fa fa-plus"></i>&nbsp;Add
              </button>
            </td>
            <td></td>
          </tr>
        </template>
      </table>
    </div>
  </div>
</template>
<script>
  import Vue from 'vue';
  import { mapGetters, mapActions } from 'vuex';
  import lodash from 'lodash';
  import v_modal from 'vue-js-modal';
  import { Languages } from '../../mixins/lang_config';

  import AuthorModal from './AuthorModal';
  import SelectLanguages from '../generic/SelectLanguages';

  Vue.use(v_modal, { dialog: true, dynamic: true });

  export default {
    data() {
      return {
        authorsList: [],
        langList: Languages,
        filters: {
          lang: [],
          name: ''
        },
        openedAuthors: []
      }
    },
    components: { SelectLanguages },
    mounted() {
      if (!this.adminOrLibrarian) {
        this.$router.push('/books');
        return;
      }
      this.loadList();
      Vue.nextTick(() => {
        this.setContainerHeight();
      });
      window.addEventListener('resize', this.setContainerHeight);
    },
    computed: {
      ...mapGetters(['adminOrLibrarian']),
      ...mapGetters('authorsModule', ['authors'])
    },
    methods: {
      addAuthor() {
        this.$modal.show(AuthorModal, {
          author: {
            id: null,
            name: "",
            alt_names: [
              ""
            ],
            language: "",
            verified_names: []
          }
        }, 
        {
          width: "590px",
          height: "auto",
          clickToClose: false
        }, {
          'closed': () =>  {
            this.loadList();
          }
        });
      },
      loadList() {
        this.getAll()
          .then(response => {
            //this.authorsList = response;
            this.filterAuthors();
          });
      },
      remove(id, check = true) {
        if (check) {
          this.$modal.show('dialog', {
            title: 'Remove author?',
            text: '',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$modal.hide('dialog');
                },
                class: 'btn btn-default'
              },
              {
                title: 'Remove',
                handler: () => {
                  this.$modal.hide('dialog');
                  this.remove(id, false);
                },
                class: 'btn btn-primary'
              }
            ]
          });
          return;
        }
        return this.removeAuthor([id])
          .then(() => {
            this.loadList();
          });
      },
      edit(author) {
        this.$modal.show(AuthorModal, {
          author: author
        }, {
          width: "590px",
          height: "auto",
          clickToClose: false
        }, {
          closed: () => {
            this.loadList();
          }
        });
      },
      editNameLang(author, nameLang) {
        this.$modal.show(AuthorModal, {
          author: lodash.assign(nameLang, {id: author.id}),
          language: nameLang.language,
          primaryAuthor: author
        }, {
          width: "590px",
          height: "auto"
        }, {
          closed: () => {
            this.loadList();
          }
        })
      },
      addNameLang(author) {
        this.$modal.show(AuthorModal, {
          author: {
            id: null,
            name: "",
            alt_names: [""],
            language: "",
            verified_names: []
          },
          primaryAuthor: author
        }, {
          width: "590px",
          height: "auto"
        }, {
          closed: () => {
            this.loadList();
            this.forceOpenNameLang(author);
          }
        });
      },
      removeNameLang(author, lang, check = true) {
        if (check) {
          this.$modal.show('dialog', {
            title: `Remove author ${this.langList[lang]}?`,
            text: '',
            buttons: [
              {
                title: 'Cancel',
                handler: () => {
                  this.$modal.hide('dialog');
                },
                class: 'btn btn-default'
              },
              {
                title: 'Remove',
                handler: () => {
                  this.$modal.hide('dialog');
                  this.removeNameLang(author, lang, false);
                },
                class: 'btn btn-primary'
              }
            ]
          });
          return;
        }
        let nameIndex = author.name_lang.findIndex(nameLang => {
          return nameLang.language === lang;
        });
        if (nameIndex !== -1) {
          author.name_lang.splice(nameIndex, 1);
          return this.updateAuthor([author.id, { name_lang: author.name_lang }])
            .then(() => {
              this.loadList();
            });
        }
      },
      applyFilter(filter, value) {
        if (value  && typeof value === 'string') {
          value = value.trim();
        }
        this.filters[filter] = value;
        setTimeout(() => {
          if (this.filters[filter] === value) {
            this.filterAuthors();
          }
        }, 300);
      },
      filterAuthors() {
        this.closeFilteredAuthors();
        if ((this.filters.lang && this.filters.lang.length > 0) || this.filters.name) {
          let foundInLang = false;
          this.authorsList = this.authors.filter(author => {
            let hasLanguage = false;
            if (this.filters.lang) {
              foundInLang = author.name_lang.find(nameLang => {
                return this.filters.lang.includes(nameLang.language);
              });
              hasLanguage = this.filters.lang.includes(author.language) || foundInLang;
              if (foundInLang) {
                this.authorOpened(author.id, true);
              }
            }
            let hasName = false;
            foundInLang = false;
            if (this.filters.name) {
              foundInLang = author.name_lang.find(nameLang => {
                return nameLang.name.toLowerCase().indexOf(this.filters.name.toLowerCase()) !== -1 || nameLang.alt_names.find(altName => {
                  return altName.toLowerCase().indexOf(this.filters.name.toLowerCase()) !== -1;
                }) || nameLang.verified_names.find(verified_name => {
                  return verified_name.toLowerCase().indexOf(this.filters.name.toLowerCase()) !== -1;
                });

              });
              hasName = author.name.toLowerCase().indexOf(this.filters.name.toLowerCase()) !== -1 || author.slug.toLowerCase().indexOf(this.filters.name.toLowerCase()) !== -1 || author.alt_names.find(altName => {
                return altName.toLowerCase().indexOf(this.filters.name.toLowerCase()) !== -1;
              }) || author.verified_names.find(verified_name => {
                return verified_name.toLowerCase().indexOf(this.filters.name.toLowerCase()) !== -1;
              }) || foundInLang;
              if (foundInLang) {
                this.authorOpened(author.id, true);
              }
            }
            return (!this.filters.lang || this.filters.lang.length === 0 || hasLanguage) && (!this.filters.name || hasName);
          });
        } else {
          this.authorsList = lodash.cloneDeep(this.authors);
        }
      },
      toggleNameLang(author) {
        let authorRow = document.querySelector(`.author.-author-${this.cleanId(author.id)}`);
        let authorNameLangRow = document.querySelectorAll(`.author-name-lang.-author-${this.cleanId(author.id)}`);
        if (authorRow.classList.contains('-closed')) {
          authorRow.classList.add('-opened');
          authorRow.classList.remove('-closed');
          authorNameLangRow.forEach(langRow => {
            langRow.classList.remove('-closed');
          });
          this.authorOpened(author.id);
        } else {
          authorRow.classList.add('-closed');
          authorRow.classList.remove('-opened');
          authorNameLangRow.forEach(langRow => {
            langRow.classList.add('-closed');
          });
          this.authorClosed(author.id);
        }
      },
      forceOpenNameLang(author) {
        Vue.nextTick(() => {
          document.querySelectorAll(`.author-name-lang.-author-${this.cleanId(author.id)}.-closed`).forEach(authorEl => {
            authorEl.classList.remove('-closed');
            authorEl.classList.add('-open');
          })
        });
      },
      cleanId(id) {
        return id.replace(/[\#\:]+/img, '-');
      },
      authorOpened(id, inFilter = false) {
        if (!this.openedAuthors.find(author => { return author.id === id})) {
          this.openedAuthors.push({id: id, inFilter: inFilter});
        }
      },
      authorClosed(id) {
        let authorIndex = this.openedAuthors.findIndex(author => {
          return id === author.id;
        });
        if (authorIndex !== -1) {
          this.openedAuthors.splice(authorIndex, 1);
        }
      },
      closeFilteredAuthors() {
        this.openedAuthors = this.openedAuthors.filter(author => {
          return author.inFilter === false;
        });
      },
      isAuthorOpened(id) {
        return this.openedAuthors.findIndex(author => {
          return author.id === id;
        }) !== -1;
      },
      setContainerHeight() {
        let containersHeight = document.querySelector('.top-menu-wrapper').offsetHeight + document.querySelector('.authors-filter').offsetHeight;
        document.querySelector('.all-authors').style.height = window.innerHeight - parseInt(containersHeight) + 'px';
      },
      ...mapActions('authorsModule', ['getAll', 'removeAuthor', 'updateAuthor'])
    }
  }
</script>
<style lang="less">
  .authors-list {
    .authors-filter {
      padding: 5px 10px;
      .author-filter {
        margin-right: 20px;
        display: inline-block;
        .filter-label {
          display: inline-block;
        }
        .filter-field {
          display: inline-block;
          input::placeholder {
            color: gray;
          }
          input {
            border: 1px solid #ccc;
            border-radius: 5px;
            height: 34px;
            padding: 0px 5px;
          }
        }
      }
    }
    .all-authors {
      overflow-y: scroll;
      table {
        thead {
          position: sticky;
          top: 0px;
          th {
            font-weight: bold;
            padding: 5px 8px;
            background-color: silver;
            font-size: 18px;
            border: 1px solid #ddd;
            min-width: 170px;
            &.-action {
              width: 75px;
              min-width: 75px;
            }
            &:first-child {
              min-width: 30px;
            }
          }
        }
        tr {
          &.author {
            &.-closed {
              .fa-minus {
                display: none;
              }
            }
            &.-opened {
              .fa-plus {
                display: none;
              }
            }
          }
          &.author-name-lang {
            &.-closed {
              display: none;
            }
            button {
              float: right;
              color: white;
            }
            &.-name-lang-header {
              td {
                background-color: silver;
                font-weight: bold;
                &:first-child {
                  background-color: inherit;
                }
              }
            }
          }
        }
        td {
          font-size: 18px;
          padding: 5px 8px;
          border: 1px solid #ddd;
          min-width: 75px;
          div.author-action {
            display: inline-block;
            padding: 0px 5px;
            &.-remove {
              i {
                color: red;
              }
            }
          }
          &.author-slug {
            color: rgb(153, 153, 153);
            &.-manual {
              color: black;
            }
          }
          &:first-child {
            min-width: 30px;
          }
        }
        tr:nth-of-type(odd) {
          background-color: #f9f9f9;
        }
      }
    }
  }
</style>