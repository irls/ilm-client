<template>
  <div class="author-link-container">
    <fieldset v-for="(author, i) in author_link" class='author-link authors-list'>
      <legend>Author</legend>

        <table class='author-link-table'>
          <tr class='author-link author-name'>
            <td>
              Author
              <i class="pi pi-exclamation-triangle author-link-empty"
                v-if="((author_link[i].id === null || author_link[i].alt_author) || (author_link[i].id && author_link[i].name_added)) && author_link[i].name"
                v-on:click="verifyAuthor(author_link[i])">
              </i>
            </td>
            <td>
              <div class='author-dropdown'>
                <input v-model='author_link[i].name'
                      @input="editAuthorLink($event, i, 'name')"
                      :disabled="!allowMetadataEdit"
                      :class="['author-name', { 'text-danger': hasError(i, 'name') }]"/>
                <Dropdown
                  :value="author_link[i]"
                  :options="author_link_arr"
                  :disabled="!allowMetadataEdit"
                  :filter="true"
                  :showClear="false&&author_link[i].id !== null"
                  :optionDisabled="getDisabledAuthors"
                  ref="author_link_name"
                  @hide="onHideAuthorLinkDropdown"
                  @change="changeAuthorLink($event, i, author)"
                  dataKey="id"
                  optionLabel="name"
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
                </Dropdown>
              </div>
            </td>
          </tr>
          <tr class='author-link author-name' v-if="currentItem.language !== 'en'">
            <td>
              Author EN
              <i class="pi pi-exclamation-triangle author-link-empty"
                v-if="(author_link[i].id === null || author_link[i].alt_author_en) && author_link[i].name_en"
                v-on:click="verifyAuthor(author_link[i], true)">
              </i>
            </td>
            <td>
              <div class='author-dropdown'>
                <input v-model='author_link[i].name_en'
                      @input="editAuthorLink($event, i, 'name_en')"
                      :disabled="authorEnDisabled(author_link[i])"
                      :class="['author-name', { 'text-danger': hasError(i, 'name_en') }]" />
                <Dropdown
                  :value="author_link[i]"
                  :options="author_link_arr"
                  :disabled="authorEnDisabled(author_link[i])"
                  :filter="true"
                  :showClear="false&&author_link[i].id !== null"
                  :optionDisabled="getDisabledAuthors"
                  ref="author_link_name_en"
                  @hide="onHideAuthorEnLinkDropdown"
                  @change="changeAuthorLink($event, i, author)"
                  dataKey="id"
                  optionLabel="name_en"
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
                </Dropdown>
              </div>
            </td>
          </tr>
          <tr class='author-link author-slug'>
            <td>Author Slug</td>
            <td>

              <input v-model='author_link[i].slug'
                      @input="editAuthorLink($event, i, 'slug')"
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
  import Dropdown from 'primevue/dropdown';
  import v_modal from 'vue-js-modal';

  Vue.use(v_modal, {dialog: true});

  export default {
    data() {
      return {
        //currentBook: {}
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
      }
    },
    components: {
      Dropdown
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
        adminOrLibrarian: 'adminOrLibrarian'
      })
    },
    created() {
      
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
        return false;
      },
      authorEnDisabled(author) {
        if (!this.allowMetadataEdit) {
          return true;
        }
        if (author.id && author.id.length > 0 && author.name && author.name.length > 0/* && !author.alt_author && !author.alt_author_en*/) {
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
        return this.selectedAuthorsIds.indexOf(val.id) >= 0;
      },
      verifyAuthor(author, author_en = false) {
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
          text+= `, ${author.slug} is absent from the Authors list.`;;
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
                this.addAuthorLang(author.id, {name: author.name});
              },
              class: 'btn btn-primary'
            }
          ];
        } else if (author.alt_author || author.alt_author_en) {
          text = `Author ${author.name}`;
          if (author.name_en) {
            text+= `, ${author.name_en}`;
          }
          text+= `, ${author.slug} is commonly recognized as ${!author_en ? author.alt_author : author.alt_author_en}.`;
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
                this.runVerifyAuthor(author, author_en);
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
      runVerifyAuthor(author, author_en) {
        let authorIndex = this.author_link.findIndex(auth => {
          return auth.slug === author.slug;
        });
        if (authorIndex >= 0) {
          if (!author_en) {
            this.author_link[authorIndex].name = author.alt_author;
            delete this.author_link[authorIndex].alt_author;
          } else {
            this.author_link[authorIndex].name_en = author.alt_author_en;
            delete this.author_link[authorIndex].alt_author_en;
          }
          this.$emit('verifyAuthor', author, author_en);
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
        this.author_link[i].id = null;
        if ((this.currentItem.language === "en" && field === "name") || (this.currentItem.language !== "en" && field === "name_en")) {
          this.author_link[i].slug = "";
        }
        if (field === "name") {
          delete this.author_link[i].alt_author;
        }
        if (this.author_link[i].name_en && field === "name") {
          this.author_link[i].name_en = "";
          delete this.author_link[i].alt_author_en;
          this.author_link[i].slug = "";
        }
        this.author_link[i].update_field = field;
        this.$emit('editAuthorLink', ev, i, field);
        //this.currentBook.author_link[i].id = null;
        //this.currentBook.author_link[i].slug = "";
        //delete this.currentBook.author_link[i].alt_author;
        //this.debounceUpdate('author_link', [...this.currentBook.author_link], false);
      },
      changeAuthorLink(ev, i) {
        const {
          id = null,
          name = '',
          name_en = '',
          slug = '',
        } = ev.value || {};
        this.author_link[i] = {id, name, name_en, slug};
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
      addAuthorLang(id, author) {
        return this.createAuthorLangFromBook([id, author])
          .then(author => {
            this.$emit('addAuthorLang', id);
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
      ...mapActions('authorsModule', ['createAuthorFromBook', 'createAuthorLangFromBook'])
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