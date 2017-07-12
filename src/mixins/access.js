import PouchDB from 'pouchdb'
import superlogin from 'superlogin-client'

export default {
  computed: {
    isAdmin: function() {return this.$store.state.auth.confirmRole('admin')},
    isEditor:  function() {return this.$store.state.auth.confirmRole('editor')},
    isLibrarian: function() {return this.$store.state.auth.confirmRole('librarian')},
    isBookkeeper: function() {return this.$store.state.auth.confirmRole('bookkeeper')},
    isEngineer: function() {return this.$store.state.auth.confirmRole('engineer')},
    isReader: function() {return this.$store.state.auth.confirmRole('reader')},
    allRolls: function() {
      var result = []
      if (this.$store.state.auth.confirmRole('admin')) result.push('admin')
      if (this.$store.state.auth.confirmRole('editor')) result.push('editor')
      if (this.$store.state.auth.confirmRole('librarian')) result.push('librarian')
      if (this.$store.state.auth.confirmRole('bookkeeper')) result.push('bookkeeper')
      if (this.$store.state.auth.confirmRole('engineer')) result.push('engineer')
      if (this.$store.state.auth.confirmRole('reader')) result.push('reader')
      return result;
    }
  },
  methods: {
    libraryDB () {
      if (!this.$store.state.isLoggedIn) {
        console.log('Cannot get library instance until logged in! ')
        return false
      }
      
      // WHAT IS THE DOCKER ENV? AND HOW IS SUPERLOGIN INITIALIZED? (AUTH IS AN INITIALIZED SUPERLOGIN)
      // var dbPath = superlogin.getDbUrl('ilm_content')
      // if (process.env.DOCKER) dbPath = dbPath.replace('couchdb', 'localhost')
      // return new PouchDB(dbPath)

      // this.$store.state.auth IS A CONFIGURED, AUTHENTICATED SUPERLOGIN INSTANCE
      return new PouchDB(this.$store.state.auth.getDbUrl('ilm_content'))
    },
    
    libraryDBmeta(){
      // WHY DO WE HAVE THIS? THIS SHOULD ALREADY BE LIVE SYNCED, WE DON'T NEED TO CONNECT MORE THAN ONCE
      return new PouchDB(this.$store.state.auth.getDbUrl('ilm_content_meta'))
    }

  }
}
