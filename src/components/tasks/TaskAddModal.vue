<template>
  <div id="taskAddModal">
    <div class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="cancel"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title">Add Job</h4>
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

    <div class="modal-body">
      <div class="form-group">
        <label>Title</label>
        <div class="form-group book-row">
          <input type="text" :class="['form-control', {'has-error': errors.name}]" v-model="name" v-on:keypress="clearErrors('name')" />
          <input type="text" class="form-control" v-model="id" disabled />
        </div>
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
    <div class="modal-footer">
      <!--<form id="book_select" enctype="multipart/form-data" @submit.prevent ref="book_select">-->
      <div class="col-sm-3 pull-right non-modal-submit">
        <button class="btn btn-primary" type="button" v-on:click="save" :disabled="saveDisabled" v-show='!isUploading'>Submit</button>
      </div>
      <div class="col-sm-9 pull-right non-modal-form">
        <!-- Import Books Modal Popup -->
        <BookImport :isModal="false"
          ref="bookImport"
          :bookId="createdJob.bookid"
          :multiple="false"
          :forceUpload="forceUploadBookImport"
          @close_modal="bookImportFinished"
          @books_changed="bookListChanged"
          @upload_error="uploadError"/>
      </div>
      <!--</form>-->
    </div>

  </div>
</template>
<script>
import { modal, alert } from 'vue-strap'
import { mapGetters, mapActions } from 'vuex'
import modalMixin from './../../mixins/modal'
import BookImport from '../books/BookImport'
import { Languages } from "@src/mixins/lang_config"
var getSlug = require('speakingurl')
export default {
  name: 'TaskAddModal',
  components: {
    modal,
    alert,
    BookImport
  },
  mixins: [modalMixin],
  props: {
    uploadInfo: Object
  },
  data() {
    return {
      roles: {
        'editor': {'require': true},
        'proofer': {'require': true},
        'narrator': {'require': true}
      },
      name: '',
      lang: 'en',
      langs: Languages,
      fields_by_type: {
        'name': {'require': true},
        'roles': {
          'editor': {'require': true},
          'proofer': {'require': true},
          'narrator': {'require': true}
        },
        'lang': {'require': true}
      },
      errors: {},
      bookUploadError: false,
      bookUploadCommonError: false,
      bookUploadCheckError: false,
      description: '',
      id: '',
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
    ...mapActions('tasks', ['createTask']),
    cancel() {
      this.$emit('close', false)
    },
    save() {
      this.bookUploadCommonError = false;
      this.bookUploadCheckError = false;

      if (!this.validate()) {
        return false
      }
      var task = {
        name: [this.name],
        type: "with-audio",
        roles: this.roles,
        description: this.description,
        id: [this.id],
        hasBooks: this.importingBooksList.length > 0,
        language: this.lang
      }
      this.createTask([task])
        .then(response => {
          this.isUploading = true;
          this.errors = null
          this.errors = {}// force re render errors
          if (Object.keys(response.errors).length > 0) {
            if (typeof response.errors[this.id] == 'undefined') {
              this.removeBook()
            } else {
              if (!this.errors['name']) {
                this.errors['name'] = [];
              }
              this.errors['name'].push(`${this.id}:${response.errors[this.id]}`)
            }
            this.isUploading = false;
          } else {
            this.createdJob = response.insert_jobs[0]
            this.$nextTick(()=>{
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
                    this.uploadInfo.create = true;
                    this.$emit('close');
                  })
                }).catch(error => {
                  this.isUploading = false;
                  this.deleteTask();
                })
              } else {
                if (this.$refs.bookImport.isDummyBook == true) {
                  this.createDummyBook({book_id: this.createdJob.bookid, jobId: this.createdJob['@rid']})
                  .then((res)=>{
                    this.updateBooksList().then(()=>{
                    if (this.createdJob.executors.editor === this.auth.getSession().user_id) {
                      this.$router.replace({ path: `/books/${this.createdJob.bookid}/edit` });
                    } else {
                      this.$router.replace({ path: `/books/${this.createdJob.bookid}` });
                      this.$store.commit('gridFilters/set_fltrChangeTrigger');
                    }
                    this.isUploading = false;
                    this.uploadInfo.create = true;
                    this.$emit('close');
                  })
                  }).catch(error => {
                    this.deleteTask()
                  });
                } else {
                  this.$emit('close');
                }
              }
            });
          }
        })
        .catch(error => {
        })
    },
    validate() {
      this.errors = {};
      for (var field in this.fields_by_type) {
        let check = this.fields_by_type[field];
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
      return Object.keys(this.errors).length == 0
    },
    addBook() {
      this.name.push('')
    },
    removeBook() {
      this.name = "";
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
    generateId() {
      this.id = this.cleanBookId((getSlug(this.name)) + '_' + (this.lang ? this.lang : ''));
    },
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
    forceUploadBookImport: {
      get() {
        return typeof this.createdJob.bookid != 'undefined';
      },
      cache: false
    },
    ...mapGetters(['auth', 'taskUsers'])
  },
  watch: {
    'name': {
      handler(val) {
        this.generateId()
      },
      deep: true
    },
    lang() {
      this.generateId()
    }
  }
}
</script>
<style lang="less">
  #taskAddModal {
    .modal-header {
      padding: 15px 15px 15px 15px;
    }
    .error-message {
      margin-left: 0%;
    }
    i.add-book {
      float: right;
      margin-top: -40px;
    }
    .book-row input {
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
  }

</style>
