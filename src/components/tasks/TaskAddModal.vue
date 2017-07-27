<template>
  <modal id="taskAddModal" :value="show" effect="fade" @closed="closed">
    <div slot="modal-header" class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="cancel"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title">Add Job</h4>
    </div>
    <div slot="modal-body" class="modal-body">
      <div class="form-group">
        <label>Type</label>
        <select v-model="type" class="form-control">
          <option v-for="task_type in task_types" :value="task_type.id">{{task_type.title}}</option>
        </select>
        <div v-if="errors.type" v-for="err in errors.type" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group" v-if="false">
        <label>Subtype</label>
        <select class="form-control" v-model="subtype">
          <option v-for="task_subtype in subtypes" :value="task_subtype.id">{{task_subtype.title}}</option>
        </select>
        <div v-if="errors.subtype" v-for="err in errors.subtype" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group" v-if="showField('name')">
        <label>Title</label>
        <div v-for="n in Object.keys(name)" class="form-group book-row">
          <input type="text" class="form-control" v-model="name[n]" />
          <i class="fa fa-minus-circle" v-if="name.length > 1" v-on:click="removeBook(n)"></i><br/>
          <input type="text" class="form-control" v-model="id[n]" disabled />
        </div>
        <i class="fa fa-plus-circle add-book" v-on:click="addBook()"></i>
        <div v-if="errors.name" v-for="err in errors.name" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group" v-if="showField('roles.editor')">
        <label>Editor</label>
        <select class="form-control" v-model="roles['editor']">
          <option v-for="user_editor in users['editor']" :value="user_editor._id">{{user_editor.email}}</option>
        </select>
        <div v-if="errors['roles.editor']" v-for="err in errors['roles.editor']" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group" v-if="showField('roles.reader')">
        <label>Reader</label>
        <select class="form-control" v-model="roles['reader']">
          <option v-for="user_reader in users['reader']" :value="user_reader._id">{{user_reader.email}}</option>
        </select>
        <div v-if="errors['roles.reader']" v-for="err in errors['roles.reader']" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group" v-if="showField('roles.proofer')">
        <label>Proofer</label>
        <select class="form-control" v-model="roles['proofer']">
          <option v-for="user_proofer in users['proofer']" :value="user_proofer._id">{{user_proofer.email}}</option>
        </select>
        <div v-if="errors['roles.proofer']" v-for="err in errors['roles.proofer']" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group" v-if="showField('roles.narrator')">
        <label>Narrator</label>
        <select class="form-control" v-model="roles['narrator']">
          <option v-for="user_narrator in users['narrator']" :value="user_narrator._id">{{user_narrator.email}}</option>
        </select>
        <div v-if="errors['roles.narrator']" v-for="err in errors['roles.narrator']" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group" v-if="showField('roles.engineer')">
        <label>Engineer</label>
        <select class="form-control" v-model="roles['engineer']">
          <option v-for="user_engineer in users['engineer']" :value="user_engineer._id">{{user_engineer.email}}</option>
        </select>
        <div v-if="errors['roles.engineer']" v-for="err in errors['roles.engineer']" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group">
        <label>Language</label>
        <select class="form-control" v-model="lang">
          <option v-for="l in langs" :value="l">{{l}}</option>
        </select>
        <div v-if="errors.lang" v-for="err in errors.lang" class="error-message" v-text="err"></div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <textarea v-model="description" class="form-control" rows="5"></textarea>
        <div v-if="errors.description" v-for="err in errors.description" class="error-message" v-text="err"></div>
      </div>
    </div>
    <div slot="modal-footer" class="modal-footer">
      <div class="col-sm-3 pull-right">
        <button class="btn btn-primary" type="button" @click="save">Submit </button>
      </div>
      <div class="col-sm-6 pull-right">
        <!-- Import Books Modal Popup -->
        <BookImport :isModal="false" 
          :bookId="createdJob.bookid" 
          :multiple="false" 
          :forceUpload="typeof createdJob.bookid != 'undefined'" 
          @close_modal="bookImportFinished"
          @books_changed="bookListChanged" />
      </div>
    </div>
  </modal>
</template>
<script>
import { modal } from 'vue-strap'
import modalMixin from './../../mixins/modal'
import axios from 'axios'
import superlogin from 'superlogin-client'
import BookImport from '../books/BookImport'
var getSlug = require('speakingurl')
const TASKS_URL = process.env.ILM_API + '/api/v1/task'
export default {
  name: 'TaskAddModal',
  components: {
    modal,
    BookImport
  },
  mixins: [modalMixin],
  props: {
    show: Boolean,
    users: Object
  },
  data() {
    return {
      type: '',
      subtype: '',
      task_types: [
        {
          'id': 'with-audio',
          'title': 'Import book with audio',
          'subtypes': []
        },
        {
          'id': 'without-audio',
          'title': 'Import book without audio',
          'subtypes': []
        }
      ],
      subtypes: [],
      roles: {},
      name: [''],
      lang: '',
      langs: ['en', 'ua'],
      fields_by_type: {
        'with-audio': {
          'name': {'require': true},
          'roles': {
            'editor': {'require': true}, 
            'proofer': {'require': true}, 
            'engineer': {'require': true}
          },
          'lang': {'require': true}
        },
        'without-audio': {
          'name': {'require': true},
          'roles': {
            'editor': {'require': true}, 
            'proofer': {'require': true}, 
            'narrator': {'require': true}, 
            'engineer': {'require': true}
          },
          'lang': {'require': true}
        }
      },
      errors: {},
      description: '',
      id: [''],
      createdJob: {},
      importingBooksList: []
    }
  },
  methods: {
    cancel() {
      var self = this
      self.$emit('closed', false)
    },
    save() {
      if (!this.validate()) {
        return false
      }
      var self = this
      //console.log(self.roles)
      var task = {
        name: self.name,
        type: self.type,
        //subtype: self.subtype,
        roles: self.roles,
        description: self.description,
        id: self.id,
        hasBooks: this.importingBooksList.length > 0
      }
      axios.post(TASKS_URL, task)
        .then(response => {
          self.errors = null
          self.errors = {}// force re render errors
          if (Object.keys(response.data.errors).length > 0) {
            for (let _id in self.id) {
              if (typeof response.data.errors[self.id[_id]] == 'undefined') {
                //console.log(_id, self.id[_id])
                self.removeBook(_id)
              } else {
                if (!self.errors['name']) {
                  self.errors['name'] = [];
                }
                self.errors['name'].push(self.id[_id] + ': ' + response.data.errors[self.id[_id]])
                //console.log(self.errors)
              }
            }
          } else {
            self.createdJob = response.data.insert_jobs[0]
            //self.$emit('closed', true)
          }
        })
        .catch(error => {
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
                this.errors[field + '.' + i].push('Required')
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
    generateIds() {
      this.id = ['']
      for (let i in this.name) {
        let _id = (getSlug(this.name[i])) + '_' + (this.lang ? this.lang : '')
        this.id[i] = _id
      }
    },
    bookImportFinished() {
      this.$emit('closed', true)
    },
    bookListChanged(list) {
      this.importingBooksList = list
    }
  },
  computed: {
      
  },
  watch: {
    type(val) {
      var self = this
      var selected = this.task_types.find(t => {
        return t.id == val
      })
      if (selected) {
        self.subtypes = selected.subtypes
      }
    },
    show() {
      this.type = ''
      this.subtype = ''
      this.roles = {}
      this.name = ['']
      this.errors = {}
      this.description = ''
      this.lang = ''
      this.createdJob = null
      this.createdJob = {}
    },
    'name': {
      handler(val) {
        this.generateIds()
      },
      deep: true
    },
    lang() {
      this.generateIds()
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
</style>