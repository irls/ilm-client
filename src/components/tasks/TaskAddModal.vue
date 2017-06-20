<template>
  <modal id="taskAddModal" :value="show" effect="fade" @closed="closed">
    <div slot="modal-header" class="modal-header">
      <button type="button" class="close" data-dismiss="modal" aria-label="Close" @click="cancel"><span aria-hidden="true">×</span></button>
      <h4 class="modal-title">Add Task</h4>
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
        <label>Book</label>
        <div v-for="n in Object.keys(name)" class="form-group book-row">
          <input type="text" class="form-control" v-model="name[n]" />
          <i class="fa fa-minus-circle" v-if="name.length > 1" v-on:click="removeBook(n)"></i>
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
    </div>
    <div slot="modal-footer" class="modal-footer">
      <button class="btn btn-primary" type="button" @click="save">Submit </button>
    </div>
  </modal>
</template>
<script>
import { modal } from 'vue-strap'
import modalMixin from './../../mixins/modal'
import axios from 'axios'
const TASKS_URL = process.env.ILM_API + '/api/v1/task'
export default {
  name: 'TaskAddModal',
  components: {
    modal
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
          'id': 1,
          'title': 'Import book with audio',
          'subtypes': []
        },
        {
          'id': 2,
          'title': 'Import book without audio',
          'subtypes': []
        }
      ],
      subtypes: [],
      roles: {},
      name: [''],
      fields_by_type: {
        '1': {
          'name': {'require': true},
          'roles': {
            'editor': {'require': true}, 
            'proofer': {'require': true}, 
            'engineer': {'require': true}
          }
        },
        '2': {
          'name': {'require': true},
          'roles': {
            'editor': {'require': true}, 
            'proofer': {'require': true}, 
            'narrator': {'require': true}, 
            'engineer': {'require': true}
          }
        }
      },
      errors: {}
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
        roles: self.roles
      }
      axios.post(TASKS_URL, task)
        .then(response => {
          self.$emit('closed', true)
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