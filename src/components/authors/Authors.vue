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
            <th>Book Language</th>
            <th>Author Name (Verified)</th>
            <th>Author Slug</th>
            <th>Author Name (Alternative)</th>
            <th class="-action"></th>
          </tr>
        </thead>
        <template v-for="author in authorsList">
          <tr class="author">
            <td>{{ langList[author.language] }}</td>
            <td>{{ author.name }}</td>
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
        }
      }
    },
    components: { SelectLanguages },
    mounted() {
      if (!this.adminOrLibrarian) {
        this.$router.push('/books');
        return;
      }
      this.loadList();
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
            language: ""
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
        if ((this.filters.lang && this.filters.lang.length > 0) || this.filters.name) {
          this.authorsList = this.authors.filter(author => {
            return (this.filters.lang && this.filters.lang.includes(author.language)) || (this.filters.name && (author.name.toLowerCase().indexOf(this.filters.name.toLowerCase()) !== -1 || author.slug.toLowerCase().indexOf(this.filters.name.toLowerCase()) !== -1));
          });
        } else {
          this.authorsList = lodash.cloneDeep(this.authors);
        }
      },
      ...mapActions('authorsModule', ['getAll', 'removeAuthor'])
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
      max-height: 80vh;
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
        }
        tr:nth-of-type(odd) {
          background-color: #f9f9f9;
        }
      }
    }
  }
</style>