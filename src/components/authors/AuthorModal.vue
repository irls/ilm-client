<template>
  <div class="author-modal">
    <div class="modal-header">
      <div>
        <h4 class="modal-title">{{ modalTitle }}</h4>
      </div>
      <button v-on:click="close()" class="close" type="button" data-dismiss="modal" aria-label="Close">
        <i class="close-modal" aria-hidden="true"></i>
      </button>
    </div>
    <div class="modal-body">
      <div class="author-form">
        <div class="author-field">
          <div class="field-label">
            <label>Author Name (Verified)</label>
          </div>
          <div class="field-value">
            <input type="text" v-model="authorEdit.name" :class="{'-has-error': errors.name}" v-on:keyup="clearError('name')" />
            <span class="validation-error" v-if="errors.name">{{ errors.name }}</span>
          </div>
        </div>
        <div class="author-field -alt-name" v-for="(alt_name, alt_name_idx) in authorEdit.alt_names">
          <div class="field-label">
            <label v-if="alt_name_idx === 0">Author Name (Alternative)</label>
          </div>
          <div class="field-value">
            <input type="text" v-model="authorEdit.alt_names[alt_name_idx]" />
          </div>
          <template v-if="authorEdit.alt_names.length > 1">
            <div class="alt-name-option">
              <i class="fa fa-minus-circle" v-on:click="removeAltName(alt_name_idx)"></i>
            </div>
          </template>
          <template v-if="authorEdit.alt_names.length > 1 && alt_name_idx === authorEdit.alt_names.length - 1">
            <div class="field-label"></div>
            <div class="field-value"></div>
          </template>
          <div class="alt-name-option">
            <i class="fa fa-plus-circle" v-if="alt_name_idx === authorEdit.alt_names.length - 1" v-on:click="addAltName()"></i>
          </div>
        </div>
        <div class="author-field" v-if="primaryAuthor.id">
          <div class="field-label">
            <label>Book Language</label>
          </div>
          <div class="field-value">
            <select v-model="authorEdit.language" :class="[{'-has-error': errors.language}]" v-on:change="clearError('language')">
              <option v-for="(lang, lang_key) in langList" :value="lang_key">{{ lang }}</option>
            </select>
            <span class="validation-error" v-if="errors.language">{{ errors.language }}</span>
          </div>
        </div>
        <div class="author-field" v-if="authorEdit.id && !primaryAuthor.id">
          <div class="field-label">
            <label>Author Slug</label>
          </div>
          <div class="field-value">
            <input type="text" v-model="authorEdit.slug" :disabled="authorEdit.published" />
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-primary" v-if="!updateProgress" v-on:click="saveAuthor()">{{ saveButtonLabel }}</button>
    </div>
  </div>
</template>
<script>
  import Vue from 'vue';
  import { mapActions } from 'vuex';
  import lodash from 'lodash';

  import { Languages } from '../../mixins/lang_config';

  export default {
    data() {
      return {
        authorEdit: {
          id: null,
          name: "",
          alt_names: [
            ""
          ],
          language: "",
          slug: ""
        },
        lang_list: Languages,
        updateProgress: false,
        errors: {}
      }
    },
    props: {
      'author': {
        type: Object,
        default() {
          return {};
        }
      }, 
      'language': {
        type: String,
        default: null
      }, 
      'primaryAuthor': {
        type: Object,
        default() {
          return {};
        }
      }
    },
    mounted() {
      this.authorEdit = lodash.cloneDeep(this.author);
      document.querySelector('.field-value input').focus();
    },
    computed: {
      modalTitle: {
        get() {
          if (this.primaryAuthor.id && !this.language) {
            return 'Add author language';
          }
          if (this.language) {
            return 'Edit author ' + this.languageLabel;
          } else {
            return this.authorEdit.id ? 'Edit author' : 'Add author';
          }
        },
        cache: false
      },
      saveButtonLabel: {
        get() {
          if (this.primaryAuthor.id) {
            return this.language ? 'Save' : 'Add';
          }
          return this.authorEdit.id || this.language ? 'Save' : 'Add author';
        },
        cache: false
      },
      languageLabel: {
        get() {
          return this.language ? Languages[this.language] : null;
        },
        cache: false
      },
      langList: {
        get() {
          if (this.primaryAuthor.id) {
            let lang_list = {};
            delete this.lang_list["en"];
            Object.keys(this.lang_list).forEach(langKey => {
              let hasLang = this.primaryAuthor.name_lang.find(nameLang => {
                return nameLang.language === langKey;
              });
              if (!hasLang || (this.language === langKey)) {
                lang_list[langKey] = this.lang_list[langKey];
              }
            });
            return lang_list;
          }
          return this.lang_list;
        },
        cache: false
      }
    },
    methods: {
      close() {
        this.$emit('close');
      },
      addAltName() {
        this.authorEdit.alt_names.push("");
        Vue.nextTick(() => {
          [...document.querySelectorAll('.author-field.-alt-name input')].at(-1).focus();
        });
      },
      removeAltName(idx) {
        if (this.authorEdit.alt_names.length > 1) {
          this.authorEdit.alt_names.splice(idx, 1);
        }
      },
      create() {
        return this.createAuthor([this.authorEdit])
          .then(response => {
            this.close();
          })
          .catch(err => {
            this.close();
          });
      },
      saveAuthor() {
        this.validate();
        if (Object.keys(this.errors).length > 0) {
          return;
        }
        this.updateProgress = true;
        if (!this.authorEdit.id && !this.language) {
          if (this.primaryAuthor.id) {
            let author = lodash.cloneDeep(this.primaryAuthor);
            author.name_lang.push(this.authorEdit);
            return this.updateAuthor([this.primaryAuthor.id, author])
              .then(() => {
                this.close();
              })
              .catch(err => {
                this.close();
              });
          } else {
            return this.create();
          }
        } else {
          return this.updateAuthor([this.authorEdit.id, this.authorEdit, this.language])
            .then(() => {
              this.close();
            })
            .catch(err => {
              this.close();
            });
        }
      },
      validate() {
        this.clearErrors();
        Object.keys(this.authorEdit).forEach(authorKey => {
          if (typeof this.authorEdit[authorKey] === "string") {
            this.authorEdit[authorKey] = this.authorEdit[authorKey].trim();
          }
        });
        if (this.authorEdit.name.length === 0) {
          this.errors.name = 'Name can not be empty';
        }

        if (this.primaryAuthor.id && !this.authorEdit.language) {
          this.errors.language = 'Language can not be empty';
        }
      },
      clearErrors() {
        this.errors = {};
      },
      clearError(field) {
        delete this.errors[field];
        this.$forceUpdate();
      },
      ...mapActions('authorsModule', ['createAuthor', 'updateAuthor'])
    }
  };
</script>
<style lang="less">
  .author-modal {
    .modal-header {
      padding: 20px 15px 20px 15px;
      h4 {
        font-weight: bold;
      }
      button.close {
        margin-top: -25px;
        i {
          &::before {
            content: "\D7";
          }
        }
      }
    }
    .author-form {
      .author-field {
        padding: 5px 0px;
        .field-label {
          display: inline-block;
          width: 35%;
          vertical-align: top;
        }
        .field-value {
          display: inline-block;
          width: 60%;
          input {
            width: 95%;
            display: inline-block;
          }
          select {
            width: 95%;
            height: 26px;
            &.-has-error {
              border: 1px solid red;
            }
          }
          .validation-error {
            color: red;
          }
        }
        .alt-name-option {
          display: inline-block;
          /* float: right; */
          margin-top: 5px;
        }
      }
    }
  }
</style>