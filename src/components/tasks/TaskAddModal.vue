<template>
  <modal
    id="taskAddModal"
    :show="isShow"
    effect="fade"
    :backdrop="false"
    @closed="closed">
    <div slot="modal-header" class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="cancel"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title">{{ modalTitle }}</h4>
      <alert
        :show="bookUploadCommonError !== false"
        placement="top"
        :duration="3000"
        type="danger"
        width="400px">
        <span class="icon-info-circled alert-icon-float-left"></span>
        <p>{{bookUploadCommonError}}.</p>
      </alert>
    </div>

    <div slot="modal-body" class="modal-body">
      <div class="form-group" v-if="showField('name')">
        <label>Title</label>
        <div v-for="(val, idx) in name" class="form-group book-row">
          <input type="text" :class="['form-control', {'has-error': errors.name}]" v-model="name[idx]" v-on:keypress="clearErrors('name')" />
          <i class="fa fa-minus-circle" v-if="name.length > 1" v-on:click="removeBook(idx)"></i><br/>
          <input type="text" class="form-control" :value="id[idx]" disabled />
        </div>
        <!-- <i class="fa fa-plus-circle add-book" v-on:click="addBook()"></i> -->
        <div v-if="errors.name" v-for="err in errors.name" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group">
        <label>Language</label>
        <select class="form-control" v-model="lang" v-on:change="filterUsers">
          <option v-for="(name, code) in langs" :value="code">{{name}}</option>
        </select>
        <div v-if="errors.lang" v-for="err in errors.lang" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group" v-for="role in rolesList">
        <label>{{role.name}}</label>
        <select :class="['form-control', {'has-error': errors['roles.' + role.id]}]" v-model="roles[role.id]" v-on:change="clearErrors('roles.' + role.id, $event)" :data-role="role.id">
          <option v-for="user in users_list[role.id]" :value="user._id">{{user.name || user._id}} {{user.email}}</option>
        </select>
        <div v-if="errors['roles.' + role.id]" v-for="err in errors['roles.' + role.id]" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea v-model="description" class="form-control job-descr" rows="5" maxlength="2000"></textarea>
        <div v-if="errors.description" v-for="err in errors.description" class="error-message" v-text="err"></div>
      </div>
    </div>
    <div slot="modal-footer" class="modal-footer">
      <!--<form id="book_select" enctype="multipart/form-data" @submit.prevent ref="book_select">-->
      <div class="col-sm-3 pull-right non-modal-submit">
        <button class="btn btn-primary" type="button" @click.prevent="save" :disabled="saveDisabled" v-show='!isUploading'>Submit</button>
      </div>
      <div class="col-sm-9 pull-right non-modal-form" v-if="!parentBook.bookid">
        <!-- Import Books Modal Popup -->
        <BookImport :isModal="false"
          ref="bookImport"
          :bookId="createdJob.bookid"
          :multiple="false"
          :forceUpload="createdJob.bookid && createdJob.bookid.length > 0"
          @close_modal="bookImportFinished"
          @books_changed="bookListChanged"
          @upload_error="uploadError"/>
      </div>
      <!--</form>-->
    </div>

  </modal>
</template>
<script>
import { modal, alert } from 'vue-strap'
import { mapGetters, mapActions } from 'vuex'
import modalMixin from './../../mixins/modal'
import axios from 'axios'
import BookImport from '../books/BookImport'
import { Languages } from "../../mixins/lang_config.js"
var getSlug = require('speakingurl')
const TASKS_URL = process.env.ILM_API + '/api/v1/task'
import api_config from '../../mixins/api_config.js';
import _ from 'lodash';

export default {
  name: 'TaskAddModal',
  components: {
    modal,
    alert,
    BookImport
  },
  mixins: [modalMixin, api_config],
  props: {
    'show': {
      type: Boolean,
      default: false
    },
    parentBook: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      isShow: false,
      type: '',
      roles: {},
      name: [''],
      lang: 'en',
      langs: Languages,
      fields_by_type: {
        'with-audio': {
          'name': {'require': true},
          'roles': {
            'editor': {'require': true},
            'proofer': {'require': true},
            'narrator': {'require': true}
          },
          'lang': {'require': true}
        },
        'without-audio': {
          'name': {'require': true},
          'roles': {
            'editor': {'require': true},
            'proofer': {'require': true},
            'narrator': {'require': true}
          },
          'lang': {'require': true}
        }
      },
      errors: {},
      bookUploadError: false,
      bookUploadCommonError: false,
      bookUploadCheckError: false,
      description: '',
      id: [''],
      createdJob: {},
      importingBooksList: [],
      isUploading: false,
      users_list: {},
      rolesList: [
        {id: 'editor', name: 'Editor'},
        {id: 'proofer', name: 'Proofer'},
        {id: 'narrator', name: 'Narrator'}
      ]
    }
  },
  mounted() {
    this.getTaskUsers()
      .then(() => {
        this.filterUsers();
      });
  },
  methods: {
    ...mapActions([
      'createDummyBook', 'getTaskUsers', 'updateBooksList'
    ]),
    ...mapActions('booksModule', [
      'createCopy',
      'getCopyBookid',
      'getUniqBookId'
    ]),
    cancel() {
      this.$emit('closed', false)
    },
    save() {
      this.bookUploadCommonError = false;
      this.bookUploadCheckError = false;

      if (!this.validate()) {
        return false
      }
      var task = {
        name: this.name,
        type: this.type,
        roles: this.roles,
        description: this.description,
        id: this.id,
        hasBooks: this.importingBooksList.length > 0,
        language: this.lang
      }
      if (this.parentBook.bookid) {
        task.parentBook = this.parentBook['@rid'];
      }
      axios.post(TASKS_URL, task)
        .then(response => {
          this.isUploading = true;
          this.errors = null
          this.errors = {}// force re render errors
          if (Object.keys(response.data.errors).length > 0) {
            for (let _id in this.id) {
              if (typeof response.data.errors[this.id[_id]] == 'undefined') {
                //console.log(_id, self.id[_id])
                this.removeBook(_id)
              } else {
                if (!this.errors['name']) {
                  this.errors['name'] = [];
                }
                this.errors['name'].push(`${this.id[_id]}:${response.data.errors[this.id[_id]]}`)
              }
            }
            this.isUploading = false;
          } else {
            this.createdJob = response.data.insert_jobs[0]
            this.$nextTick(()=>{
              if (this.$refs.bookImport) {
                if (!this.$refs.bookImport.saveDisabled) {
                  this.$refs.bookImport.onFormSubmit()
                  .then((res)=>{
                    this.updateBooksList().then(()=>{
                      if (this.createdJob.executors.editor === this.auth.getSession().user_id) {
                        this.$router.replace({ path: `/books/${this.createdJob.bookid}/edit` });
                      } else {
                        this.$router.replace({ path: `/books/${this.createdJob.bookid}` });
                        this.$store.commit('gridFilters/set_fltrChangeTrigger');
                      }
                      this.isUploading = false;
                      this.$emit('closed', true);
                    })
                  }).catch(error => {
                    console.error(`error::: `, (error.message || error));
                    this.isUploading = false;
                    this.deleteTask();
                  })
                } else {
                  if (this.$refs.bookImport.isDummyBook == true) {
                    this.createDummyBook({book_id: this.createdJob.bookid, jobId: this.createdJob['@rid']})
                    .then((res)=>{
                      this.updateBooksList()
                      .then(()=>{
                        if (this.createdJob.executors.editor === this.auth.getSession().user_id) {
                          this.$router.replace({ path: `/books/${this.createdJob.bookid}/edit` });
                        } else {
                          this.$router.replace({ path: `/books/${this.createdJob.bookid}` });
                          this.$store.commit('gridFilters/set_fltrChangeTrigger');
                        }
                        this.isUploading = false;
                        this.$emit('closed', true);
                      })
                      .catch(error => {
                        console.error(`error::: `, (error.message || error));
                        this.deleteTask()
                      });
                    })
                    .catch(error => {
                      console.error(`error::: `, (error.message || error));
                      this.deleteTask()
                    });
                  } else {
                    this.isUploading = false;
                    this.$emit('closed', true);
                  }
                }
              } else if (this.parentBook.bookid) {
                return this.createCopy([this.parentBook.bookid, this.createdJob.bookid])
                  .then(() => {
                    this.updateBooksList().then(()=>{
                      if (this.createdJob.executors.editor === this.auth.getSession().user_id) {
                        this.$router.push({ path: `/books/${this.createdJob.bookid}/edit` });
                        this.$root.$emit("book-reimported");// emit to reload book and blocks
                      }
                      this.isUploading = false;
                      this.$emit('closed', true);
                    })
                  });
              } else {
                this.$emit('closed', true);
              }
            })
          }
        })
        .catch(error => {
          console.error(`error::: `, (error.message || error));
          this.$emit('closed', true);
        })
    },
    showField(name) {
      if (this.type && this.fields_by_type[this.type]) {
        let names = name.split('.')
        let check = this.fields_by_type[this.type]
        for (let i in names) {
          if (!check[names[i]]) {
            return false
          }
          check = check[names[i]]
        }
        return true
      } else {
        return false
      }
    },
    validate() {
      this.errors = {}
      //console.log(this.roles)
      if (!this.type) {
        if (!this.errors['type']) {
          this.errors['type'] = []
        }
        this.errors['type'].push('Required')
      } else {
        for (var field in this.fields_by_type[this.type]) {
          let check = this.fields_by_type[this.type][field]
          if (Object.keys(check).indexOf('require') !== -1) {
            if (check['require'] === true) {
              let has_error = false
              if (this[field] instanceof Array) {
                for (let n in this[field]) {
                  if (!this[field][n]) {
                    has_error = true
                  }
                }
              } else {
                has_error = !this[field]
              }
              if (has_error) {
                if (!this.errors[field]) {
                  this.errors[field] = []
                }
                this.errors[field].push('Required')
              }
            }
          } else {
            for (let i in check) {
              if (check[i]['require'] === true && !this[field][i]) {
                if (!this.errors[field + '.' + i]) {
                  this.errors[field + '.' + i] = []
                }
                this.errors[field + '.' + i].push(`Please define ${i}`);
              }
            }
          }
        }
      }
      return Object.keys(this.errors).length == 0
    },
    addBook() {
      this.name.push('')
    },
    removeBook(n) {
      this.name.splice(n, 1)
    },
    cleanBookId(bookId) {
      let cleanId = bookId.replace(/[\-\,\.]/g,'_');
      if (cleanId.length > 50) {
        var md5 = require('md5');
        cleanId = cleanId.substr(0, 50) + md5(cleanId);
      }
      //console.log('cleanId', cleanId);
      return cleanId;
    },

    async generateIds() {
      //if (!this.parentBook.bookid || !this.id[0]) {
      const newBookIds = [];
      for (let i in this.name) {
        // old method for fallback
        let _id = this.cleanBookId((getSlug(this.name[i])) + '_' + (this.lang ? this.lang : ''));
        try {
          var response = await this.getUniqBookId({
            title: this.name[i],
            language: this.lang,
            parentId: this.parentBook.bookid || null
          });
          if (response && response.bookId) {
            _id = response.bookId;
          }
        } catch (err) {
          console.error('Error:', (err.message || err));
        }
        newBookIds[i] = _id;
      }

      this.id = newBookIds;
    },

    generateIdsDebounced: _.debounce(function() {
      this.generateIds();
    }, 300),

    bookImportFinished() {
      this.$emit('closed', true)
    },
    uploadError(errors) {
      this.bookUploadError = true;
      if (Array.isArray(errors)) {
        this.bookUploadCheckError = errors;
      } else {
        this.bookUploadCommonError = errors;
      }
      this.deleteTask();
    },
    deleteTask() {
      return axios.delete(TASKS_URL, { data: {id: this.id} })
      .then(function(response){
        return Promise.resolve({ok: true});
      }).catch((err) => {
        return Promise.reject(err);
      });
    },
    bookListChanged(list) {
      this.importingBooksList = list
    },
    filterUsers() {
      for (let role in this.taskUsers) {
        this.users_list[role] = this.taskUsers[role].filter(u => {
          //console.log(u.languages, this.lang, u.languages.indexOf(this.lang))
          return !u._id || u._id === 'unassigned' || (Array.isArray(u.languages) && u.languages.indexOf(this.lang) !== -1);
        });
        if (role === 'narrator') {
          this.users_list[role].unshift({'_id':'unassigned', 'email':'', 'name':'Unassigned'});
        }
        this.users_list[role].unshift({});
      }
      for (let role in this.users_list) {
        if (this.users_list[role].length === (role === 'narrator' ? 2 : 1)) {// only empty and unassigned
          this.users_list[role].push({'_id': -1, name: `No ${role}s qualified`, email: ''});
        }
      }
      for (let role in this.roles) {
        if (!this.users_list[role] || !this.users_list[role].find(u => {
          return u._id === this.roles[role];
        })) {
          this.roles[role] = '';
        }
      }
    },
    clearErrors(field, ev) {
      if (!ev || !ev.target || (ev.target.value && `${ev.target.value}` !== '-1')) {
        delete this.errors[field];
      }
      this.checkUserValue(field, ev);
      this.$forceUpdate();
    },
    checkUserValue(field, ev) {
      switch (field) {
        case 'name':
          break;
        default:
          if (ev.target && `${ev.target.value}` === "-1") {
            this.roles[ev.target.dataset.role] = '';
          }
          break;
      }
    }
  },
  computed: {
    saveDisabled: function() {
      //return false; // while we need to create job without book
      return this.bookUploadError && this.importingBooksList.length == 0;
    },
    modalTitle: {
      get() {
        return this.parentBook.bookid ? "Add book copy" : "Add Job"
      },
    },
    ...mapGetters(['auth', 'taskUsers'])
  },
  watch: {
    'show': {
      handler(val, oldVal) {

        this.isShow = false;

        this.type = 'with-audio'
        this.roles = {}
        this.name = [''];
        this.id = [''];
        this.errors = {}
        this.description = ''
        this.lang = 'en'
        this.createdJob = null
        this.createdJob = {}
        this.bookUploadError = false;
        this.isUploading = false;

        if (this.$refs.bookImport) {
          this.$refs.bookImport.isDummyBook = true;
        }
        if (val === true) {
          if (this.parentBook.language) {
            this.lang = this.parentBook.language;
            this.name[0] = this.parentBook.title;
            // this.getCopyBookid([this.parentBook.bookid])
            //   .then(copy_bookid => {
            //     this.id[0] = copy_bookid;
            //     this.$forceUpdate();
            //   })
          }
        }

        this.isShow = val;

      },
      cache: false
    },
    'name': {
      handler(val) {
        this.generateIdsDebounced()
      },
      deep: true
    },
    lang() {
      this.generateIdsDebounced()
    }
  }
}
</script>
<style scoped>
.error-message {
  margin-left: 0%;
}
i.add-book {
  float: right;
  margin-top: -40px;
}
.book-row input {
  width: 90%;
  display: inline-block;
}
textarea.job-descr {
  resize: vertical;
}

  .alert-icon-float-left {
    font-size: 40px;
    float: left;
    color: #a94442;
  }

  .alert-text-float-right {
    float: right;
    text-align: left;
    width: 400px;
  }

  .alert.top .alert-text-float-right p {
    text-align: left;
    margin: 5px 0;
    word-break: break-word;
  }

  .modal-footer .non-modal-submit {
    width: 15%;
  }

  .modal-footer .non-modal-form {
    width: 85%;
  }

  .has-error {
    border: 1px solid red;
  }

</style>
