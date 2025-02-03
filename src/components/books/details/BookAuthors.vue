<template>
  <div class="author-link-container">
    <fieldset v-for="(author, i) in author_link" class='author-link authors-list'>
      <legend>Author</legend>

        <table class='author-link-table'>
          <tr class='author-link author-name'>
            <td>
              Author
              <i class="pi pi-exclamation-triangle author-link-empty"
                v-if="((author_link[i].id === null || author_link[i].alt_author) || (author_link[i].id && author_link[i].name_added)) && author_link[i].name && inputField !== 'name_' + i"
                v-on:click="verifyAuthor(author_link[i], false, i)">
              </i>
            </td>
            <td>
              <div class="update-in-progress" v-if="updatingIndex === i">
                <span class="update-spinner"></span>
              </div>
              <div class='author-dropdown'>
                <input v-model='author_link[i].name'
                      @change="editAuthorLink($event, i, 'name')"
                      @input="startInput('name_' + i)"
                      :disabled="!allowMetadataEdit"
                      :class="['author-name', { 'text-danger': hasError(i, 'name') }]"/>
                <DropdownILM
                  :value="author_link[i]"
                  :options="authorsList"
                  :disabled="!allowMetadataEdit"
                  :filter="true"
                  :showClear="false&&author_link[i].id !== null"
                  :optionDisabled="getDisabledAuthors"
                  ref="author_link_name"
                  @hide="onHideAuthorLinkDropdown"
                  @change="changeAuthorLink($event, i)"
                  dataKey="key"
                  optionLabel="name_filter"
                  filterPlaceholder="Filter Authors">
                  <template #value="slotProps">
                      <div class="" v-if="slotProps.value">
                        <!--<div v-if="slotProps.value.name">{{slotProps.value.name}}</div>-->
                        <!--<div v-else>{{slotProps.value}}</div>-->
                      </div>
                      <span v-else>
                        <!--{{slotProps.placeholder}}-->
                      </span>
                  </template>
                  <template #option="slotProps">
                      <div class="" style="max-width: 260px; text-wrap: balance;">
                        <div>{{slotProps.option.name}}</div>
                      </div>
                  </template>
                </DropdownILM>
              </div>
            </td>
          </tr>
          <tr class='author-link author-name' v-if="currentItem.language !== 'en'">
            <td>
              Author EN
              <i class="pi pi-exclamation-triangle author-link-empty"
                v-if="(author_link[i].id === null || author_link[i].alt_author_en) && author_link[i].name_en && inputField !== 'name_en_' + i"
                v-on:click="verifyAuthor(author_link[i], true, i)">
              </i>
            </td>
            <td>
              <div class='author-dropdown'>
                <input v-model='author_link[i].name_en'
                      @change="editAuthorLink($event, i, 'name_en')"
                      @input="startInput('name_en_' + i)"
                      :disabled="authorEnDisabled(author_link[i])"
                      :class="['author-name', { 'text-danger': hasError(i, 'name_en') }]" />
                <DropdownILM
                  :value="author_link[i]"
                  :options="authorsEnList"
                  :disabled="authorEnDisabled(author_link[i])"
                  :filter="true"
                  :showClear="false&&author_link[i].id !== null"
                  :optionDisabled="getDisabledAuthorsEn"
                  ref="author_link_name_en"
                  @hide="onHideAuthorEnLinkDropdown"
                  @change="changeAuthorLink($event, i, true)"
                  dataKey="key"
                  optionLabel="name_en_filter"
                  filterPlaceholder="Filter Authors">
                  <template #value="slotProps">
                      <div class="" v-if="slotProps.value">
                        <!--<div v-if="slotProps.value.name">{{slotProps.value.name}}</div>-->
                        <!--<div v-else>{{slotProps.value}}</div>-->
                      </div>
                      <span v-else>
                        <!--{{slotProps.placeholder}}-->
                      </span>
                  </template>
                  <template #option="slotProps">
                      <div class="" style="max-width: 260px; text-wrap: balance;">
                        <div>{{slotProps.option.name_en}}</div>
                      </div>
                  </template>
                </DropdownILM>
              </div>
            </td>
          </tr>
          <tr class='author-link author-slug'>
            <td>Author Slug</td>
            <td>

              <input v-model='author_link[i].slug'
                      @change="editAuthorLink($event, i, 'slug')"
                    :disabled="authorSlugDisabled(author_link[i])"
                    :class="['author-slug']" />
              <!--, {'text-danger': requiredFields[currentBook.bookid] && requiredFields[currentBook.bookid]['author_link']}-->

              <span v-if="hasError(i)" class="validation-error" style="text-align: right !important;">{{ getError(i) }}</span>

            </td>
          </tr>
          <tr class='author-link rem-author' v-if="author_link.length > 1 && allowMetadataEdit">
            <td colspan="2">
              <div v-if="allowMetadataEdit" class='author-link rem-author'>
                <button v-on:click="removeAuthorLink($event, i)" :disabled="!allowMetadataEdit" >
                  <i class="fa fa-minus-circle" style="margin-right: -18px;"></i>
                </button>
              </div>
            </td>
          </tr>
        </table>


    </fieldset>

    <div v-if="allowMetadataEdit" class='author-link add-author'>
      <button v-on:click="addAuthorLink" :disabled="!allowMetadataEdit">
        <i class="fa fa-plus-circle"></i>
        <span class="author-link add-author-hint">Add author</span>
      </button>
    </div>
  </div>
</template>
<script>
  import Vue from 'vue';
  import { mapGetters, mapActions } from 'vuex';
  import lodash from "lodash";
  import DropdownILM from "../../generic/components/DropdownILM";
  import v_modal from 'vue-js-modal';

  Vue.use(v_modal, {dialog: true});

  export default {
    data() {
      return {
        inputField: null,
        updatingIndex: null,
        authorsList: [],
        authorsEnList: []
      }
    },
    props: {
      allowMetadataEdit: {
        type: Boolean,
        default: false
      },
      'requiredFields': {
        type: Object,
        default: () => {
          return {};
        }
      },
      /*currentBook: {
        type: Object, 
        default: () => {
          return {};
        }
      },*/
      author_link: {
        type: Array
      },
      authorUpdated: {
        type: Boolean
      }
    },
    components: {
      DropdownILM
    },
    computed: {

      selectedAuthorsIds: {
        get() {
          return this.author_link.map((a)=>a.id)
        },
        cache: true
      },
      currentItem: {
        get() {
          if (this.currentBookMeta && this.currentBookMeta.bookid) {
            return this.currentBookMeta;
          } else if (this.currentCollection && this.currentCollection._id) {
            return this.currentCollection;
          }
          return {};
        },
        cache: false
      },
      ...mapGetters({
        currentBookMeta: 'currentBookMeta',
        currentCollection: 'currentCollection',
        author_link_arr: 'authorsMapModule/author_link_arr',
        adminOrLibrarian: 'adminOrLibrarian',
        various_authors: "authorsMapModule/various_authors",
      }),
      ...mapGetters('authorsMapModule', ["authorsLangList", "isVariousId"]),
      ...mapGetters('authorsModule', ['authors'])
    },
    created() {
      this.setAuthorsList();
    },
    methods: {
      authorSlugDisabled(author) {
        if (!this.allowMetadataEdit) {
          return true;
        }
        if (author.id && author.id.length > 0) {
          return true;
        }
        if (this.currentItem.language !== "en" && (!author.name_en || !author.name_en.length)) {
          return true;
        }
        if (this.currentItem.language === "en" && (!author.name || author.name.length === 0)) {
          return true;
        }
        return false;
      },
      authorEnDisabled(author) {
        if (!this.allowMetadataEdit) {
          return true;
        }
        if (author.id && author.id.length > 0 && author.name && author.name.length > 0 && !author.name_added) {
          return true;
        }
        return false;
      },
      onHideAuthorLinkDropdown() {
        for (const filter of this.$refs.author_link_name) {
          filter.filterValue = '';
        }
      },

      onHideAuthorEnLinkDropdown() {
        for (const filter of this.$refs.author_link_name_en) {
          filter.filterValue = '';
        }
      },

      getDisabledAuthors(val) {
        return this.author_link.find(author => {
          return author.id === val.id && author.name === val.name;
        });
      },
      getDisabledAuthorsEn(val) {
        return this.author_link.find(author => {
          return author.id === val.id && author.name_en === val.name_en;
        });
      },
      verifyAuthor(author, author_en = false, authorIdx = null) {
        if (!this.adminOrLibrarian) {
          return;
        }
        let text = '';
        let buttons = [];
        if (author.name && author.name.length > 0 && (this.currentItem.language === "en" || (author.name_en && author.name_en.length > 0)) && author.slug && !author.id) {
          text = `Author ${author.name}`;
          if (author.name_en) {
            text+= `, ${author.name_en}`;
          }
          text+= `, ${author.slug} is absent from the Authors list.<br>Add Author?`;;
          buttons = [
          {
              title: 'Cancel',
              handler: () => {
                this.$modal.hide('dialog');
              },
              class: 'btn btn-default'
            },
            {
              title: 'Add Author',
              handler: () => {
                this.$modal.hide('dialog');
                this.addAuthor(author);
              },
              class: 'btn btn-primary'
            }
          ];
        } else if (!author_en && author.name_added) {
          text = `Author ${author.name}, ${author.slug} is absent from the Authors list.<br>Add Author?`;
          buttons = [
          {
              title: 'Cancel',
              handler: () => {
                this.$modal.hide('dialog');
              },
              class: 'btn btn-default'
            },
            {
              title: 'Add author',
              handler: () => {
                this.$modal.hide('dialog');
                this.addAuthorLang(author.id, {name: author.name}, authorIdx);
              },
              class: 'btn btn-primary'
            }
          ];
        } else if (author.alt_author || author.alt_author_en) {
          text = `Author ${author.name}`;
          if (author.name_en) {
            text+= `, ${author.name_en}`;
          }
          text+= `, ${author.slug} is commonly recognized as ${!author_en ? author.alt_author : author.alt_author_en}.<br>Update Author?`;
          buttons = [
            {
              title: 'Cancel',
              handler: () => {
                this.$modal.hide('dialog');
              },
              class: 'btn btn-default'
            },
            {
              title: 'Update',
              handler: () => {
                this.$modal.hide('dialog');
                this.runVerifyAuthor(author, author_en, authorIdx);
              },
              class: 'btn btn-primary'
            }
          ];
        } else {
          text = `Author ${!author_en ? author.name : author.name_en}`;
          if (author_en && author.slug) {
            text+= `, ${author.slug}`;
          }
          text+= ` is absent from the Authors list`;
          buttons = [
            {
              title: 'Ok',
              handler: () => {
                this.$modal.hide('dialog');
              },
              class: 'btn btn-primary'
            }
          ];
        }
        this.$modal.show('dialog', {
          title: 'Verify Author',
          text: text,
          buttons: buttons
        });
      },
      runVerifyAuthor(author, author_en, authorIdx) {
        /*if (authorIdx >= 0) {
          if (!author_en) {
            this.author_link[authorIdx].name = author.alt_author;
            delete this.author_link[authorIdx].alt_author;
          } else {
            this.author_link[authorIdx].name_en = author.alt_author_en;
            delete this.author_link[authorIdx].alt_author_en;
          }
          this.updatingIndex = authorIdx;
          this.$emit('verifyAuthor', author, author_en, authorIdx);
        }*/
        if (authorIdx >= 0) {
          return this.getAuthor([author.id])
            .then(dbAuthor => {
              let langAuthor = lodash.cloneDeep(dbAuthor);
              if (this.currentItem.language !== "en") {
                let nameLang = dbAuthor.name_lang.find(name_lang => {
                  return name_lang.language === this.currentItem.language;
                });
                if (nameLang) {
                  langAuthor = lodash.cloneDeep(nameLang);
                }
              }
              if (!author_en) {
                let updateName = "";
                if (langAuthor.name === author.alt_author || langAuthor.verified_names.includes(author.alt_author)) {
                  updateName = author.alt_author;
                } else {
                  updateName = langAuthor.name;
                }
                this.author_link[authorIdx].name = updateName;
                delete this.author_link[authorIdx].alt_author;
              } else {
                this.author_link[authorIdx].name_en = dbAuthor.name === author.alt_author_en || dbAuthor.verified_names.includes(author.alt_author_en) ? author.alt_author_en : dbAuthor.name;
                delete this.author_link[authorIdx].alt_author_en;
              }
              this.updatingIndex = authorIdx;
              this.$emit('verifyAuthor', author, author_en, authorIdx);
            });
        }
      },
      addAuthor(author) {
        let authorIndex = this.author_link.findIndex(auth => {
          return auth.slug === author.slug && auth.name === author.name;
        });
        if (authorIndex >= 0) {
          return this.createAuthorFromBook([author])
            .then(addedAuthor => {
              this.$emit('addAuthor', addedAuthor, authorIndex);
            });
        }
      },
      editAuthorLink(ev, i, field) {
        let hasTranslation = this.author_link[i].id && this.hasTranslation(this.author_link[i].id);
        if ((this.currentItem.language === "en" && field === "name") || (this.currentItem.language !== "en" && field === "name_en")) {
          this.author_link[i].slug = "";
        }
        if (field === "name") {
          delete this.author_link[i].alt_author;
        }
        if (this.author_link[i].name_en && field === "name" && this.author_link[i].id && hasTranslation) {
          this.author_link[i].name_en = "";
          delete this.author_link[i].alt_author_en;
          this.author_link[i].slug = "";
        }

        if ((field === "name" && (this.currentItem.language === "en" || hasTranslation)) || field === "name_en") {
          this.author_link[i].id = null;
        }
        this.author_link[i].update_field = field;
        let variousAuthor = this.various_authors.find(author => {
          return author.name.toLowerCase().trim() === ev.target.value.toLowerCase().trim();
        });
        if (variousAuthor) {
          this.author_link[i] = variousAuthor;
        }
        Object.keys(this.author_link[i]).forEach(key => {
          if (this.author_link[i][key] && typeof this.author_link[i][key] === "string") {
            this.author_link[i][key] = this.author_link[i][key].trim();
          }
        });
        this.updatingIndex = i;
        this.$emit('editAuthorLink', ev, i, field);
        //this.currentBook.author_link[i].id = null;
        //this.currentBook.author_link[i].slug = "";
        //delete this.currentBook.author_link[i].alt_author;
        //this.debounceUpdate('author_link', [...this.currentBook.author_link], false);
      },
      changeAuthorLink(ev, i, author_en = false) {
        this.inputField = null;
        const {
          id = null,
          name = '',
          name_en = '',
          slug = '',
        } = ev.value || {};
        this.author_link[i] = {id, name, name_en, slug};
        this.author_link[i].slug = "";
        this.author_link[i].update_field = author_en ? "name_en" : "name";
        if (author_en) {
          this.author_link[i].name = "";
        } else {
          this.author_link[i].name_en = "";
        }
        this.updatingIndex = i;
        this.$emit('changeAuthorLink', ev, i);
      },
      addAuthorLink() {
        this.author_link.push({
            id: null,
            name: '',
            name_en: '',
            slug: '',
          });
        this.$emit('addAuthorLink');
      },
      removeAuthorLink(ev, i) {
        if (this.author_link[i]) {
          this.author_link.splice(i, 1);
          this.$emit('removeAuthorLink', ev, i);
        }
      },
      addAuthorLang(id, author, authorIdx) {
        this.updatingIndex = authorIdx;
        return this.createAuthorLangFromBook([id, author])
          .then(author => {
            this.$emit('addAuthorLang', id, authorIdx);
            this.setAuthorsList();
          });
      },
      hasError(authorLinkIndex, field = null) {
        let hasError = this.requiredFields && this.requiredFields['author_link'] && this.requiredFields['author_link'][authorLinkIndex];
        return hasError && (!field || this.requiredFields['author_link'][authorLinkIndex][field]);
      },
      getError(authorLinkIndex, field = null) {
        let error = '';
        if (this.requiredFields && this.requiredFields['author_link'] && this.requiredFields['author_link'][authorLinkIndex]) {
          error = this.requiredFields['author_link'][authorLinkIndex];
          if (field && error[field]) {
            error = error['field'];
          }
          if (error === true) {
            error = 'Define Author';
          }
          if (error instanceof Object) {
            error = Object.values(error)[0];
          }
        }
        return error;
      },
      startInput(inputField) {
        this.inputField = inputField;
      },
      hasTranslation(id) {
        if (this.currentItem.language === "en") {
          return true;
        }
        if (this.isVariousId(id)) {
          return true;
        }
        return this.authors.find(author => {
          return author.id === id && author.name_lang.find(name_lang => {
            return name_lang.language === this.currentItem.language;
          });
        }) ? true : false;
      },
      setAuthorsList() {
        this.authorsList = this.authorsLangList(this.currentItem.language, this.currentItem.language);
        this.authorsEnList = this.authorsLangList("en", this.currentItem.language);
      },
      ...mapActions('authorsModule', {
        createAuthorFromBook: 'createAuthorFromBook', 
        createAuthorLangFromBook: 'createAuthorLangFromBook', 
        getAll: 'getAll',
        getAuthor: 'get'
      })
    },
    'watch': {
      authorUpdated: {
        handler(val) {
          if (this.authorUpdated) {
            this.inputField = null;
            this.updatingIndex = null;
          }
        }
      },
      updatingIndex: {
        handler(val) {
          if (val === null) {
            this.getAll()
              .then(() => {
                this.setAuthorsList();
              })
          }
        }
      },
      "authors.length": {
        handler(val) {
          this.setAuthorsList();
        }
      },
      "currentItem.id": {
        handler() {
          this.getAll()
            .then(() => {
              this.setAuthorsList();
            });
        }
      },
      "currentItem.language": {
        handler() {
          this.getAll()
            .then(() => {
              this.setAuthorsList();
            });
        }
      }
    }
  }
</script>
<style lang="less">
.author-link-container {

  fieldset.authors-list {
    width: 100%;
    padding: 0px 2px 5px 2px;
    margin: 0;
    border: 1px solid #b9b6b6;
    position: relative;
  }
  legend {
    width: auto;
    border-bottom: 0;
    font-size: 12px;
    margin-bottom: 0;
  }

  td {
    padding: 0;
  }

  table.author-link-table {
    width: 100%;

    tr.author-link {
      border: none;
      background-color: white;

      &.rem-author {
        height: 15px;
      }

      &:nth-child(odd) {
        background-color: #F0F0F0;
      }

      div.author-dropdown {
        position: relative;
        width: 100%;
        max-height: 32px;

      }

      td:nth-child(1) {
        padding: 3px;
        width: 28%;
      }

      td:nth-child(2) {
        padding: 2px 0px 2px 2px;
        text-align: left;

        div.p-dropdown.p-component {
          /*border-radius: 0px 2px 2px 0px;*/
          /*border-left-width: 0px;*/
          height: 30px;
          position: relative;
          top: -30px;
          width: 100%;
        }
      }

      input.author-name {
        width: 86%;
        height: 30px;
        margin-left: 0;
        margin-right: auto;
        border: 1px solid rgb(118, 118, 118);
        border-radius: 2px 0px 0px 2px;
        position: relative;
        z-index: 1;
        /*border-right-width: 0px;*/

        &:disabled {
          border: 1px solid rgba(118, 118, 118, 0.3);
        }
      }

      i.author-link-empty {
        font-size: 1.6rem;
        margin-left: 3px;
        color: red;
        float: right;
        cursor: pointer;
      }

      input.author-slug {
        position: relative;
        width: 100%;
      }
    }
    .update-in-progress {
      position: absolute;
      z-index: 999;
      width: 71%;
      height: 100%;
      background: #80808026;
      span.update-spinner {
        background: url(/static/preloader-snake-transparent-tiny.gif);
        display: inline-block;
        width: 14px;
        height: 14px;
        vertical-align: text-top;
        width: 90%;
        background-repeat: no-repeat;
        background-position-x: right;
      }
    }
  }

  div.add-author, div.rem-author {
    width: 20px;
    height: 15px;
    margin-top: 4px;
    margin-left: auto;
    margin-right: 0;

    button { border: none !important; background-color: inherit; padding: 0 }
    button.disabled i { display: none; border: none; }
  }

  div.add-author {
    width: 97px;
    height: 21px;

    span.add-author-hint {
      margin-left: 5px;
      color: grey;
    }
  }
}


tr.author-link {
/*      td { width: auto; text-align: left; }
  &.add-author {
    button { border: none !important; background-color: inherit; padding: 0 }
    button.disabled i { display: none; border: none; }
  }*/

/*      div.p-dropdown.p-component.p-dropdown-clearable {
    height: 31px;
    width: 42px;
    margin-top: -10px;
    top: 10px;
    border-left-width: 0px;

    span.p-dropdown-label.p-inputtext {
      padding-right: 0px;
      padding-left: 0px;
    }

  }*/

/*      input {
    &.author-name {
      width: 86%;
      margin-right: -5px;
    }
  }*/
}
</style>