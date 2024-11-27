<template>
  <div class="author-link-container">
  <fieldset v-for="(author, i) in author_link" class='author-link authors-list'>
                  <legend>Author</legend>

                    <table class='author-link-table'>
                      <tr class='author-link author-name'>
                        <td>
                          Author
                          <i class="pi pi-exclamation-triangle author-link-empty"
                            v-if="(author_link[i].id === null || author_link[i].alt_author) && author_link[i].name"
                            v-on:click="verifyAuthor(author_link[i])">
                          </i>
                        </td>
                        <td>
                          <div class='author-dropdown'>
                            <input v-model='author_link[i].name'
                                  @input="editAuthorLink($event, i, 'name')"
                                  :disabled="!allowMetadataEdit"
                                  :class="['author-name', { 'text-danger': requiredFields[currentBookMeta.bookid] && requiredFields[currentBookMeta.bookid]['author_link'] }]"/>
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
                      <tr class='author-link author-name' v-if="currentBookMeta.language !== 'en'">
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
                                  :class="['author-name', { 'text-danger': requiredFields[currentBookMeta.bookid] && requiredFields[currentBookMeta.bookid]['author_link'] }]" />
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

                          <span v-if="requiredFields[currentBookMeta.bookid] && requiredFields[currentBookMeta.bookid]['author_link']" class="validation-error" style="text-align: right !important;">Define Author</span>

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
  import { mapGetters } from 'vuex';
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
        type: Array
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
      ...mapGetters({
        currentBookMeta: 'currentBookMeta',
        author_link_arr: 'authorsMapModule/author_link_arr'
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
        if (this.currentBookMeta.language !== "en" && (!author.name_en || !author.name_en.length)) {
          return true;
        }
        return false;
      },
      authorEnDisabled(author) {
        if (!this.allowMetadataEdit) {
          return true;
        }
        if (author.id && author.id.length > 0/* && !author.alt_author && !author.alt_author_en*/) {
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
        let text = '';
        let buttons = [];
        if (author.alt_author || author.alt_author_en) {
          text = `Author ${!author_en ? author.name : author.name_en}`;
          if (author.name_en && !author_en) {
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
                this.$emit('verifyAuthor', author, author_en);
              },
              class: 'btn btn-primary'
            }
          ];
        } else {
          text = `Author ${!author_en ? author.name : author.name_en} is absent from the Authors list`;
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
      editAuthorLink(ev, i, field) {
        this.$emit('editAuthorLink', ev, i, field);
        //this.currentBook.author_link[i].id = null;
        //this.currentBook.author_link[i].slug = "";
        //delete this.currentBook.author_link[i].alt_author;
        //this.debounceUpdate('author_link', [...this.currentBook.author_link], false);
      },
      changeAuthorLink(ev, i) {
        this.$emit('changeAuthorLink', ev, i);
      },
      addAuthorLink() {
        this.$emit('addAuthorLink');
      },
      removeAuthorLink(ev, i) {
        this.$emit('removeAuthorLink', ev, i);
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