import PouchDB from 'pouchdb'
//import superlogin from 'superlogin-client'

export default {
  data() {
    return {
      roles: [
        'admin',
        'editor',
        'narrator',
        'proofer',
        'librarian',
        'bookkeeper',
        'engineer'
      ]
    }
  },
  computed: {
    isAdmin: function() {return this.$store.state.auth.confirmRole('admin')},
    isEditor:  function() {return this.$store.state.auth.confirmRole('editor')},
    isNarrator:  function() {return this.$store.state.auth.confirmRole('narrator')},
    isProofer:  function() {return this.$store.state.auth.confirmRole('proofer')},
    isLibrarian: function() {return this.$store.state.auth.confirmRole('librarian')},
    isBookkeeper: function() {return this.$store.state.auth.confirmRole('bookkeeper')},
    isEngineer: function() {return this.$store.state.auth.confirmRole('engineer')},
    isReader: function() {return this.$store.state.auth.confirmRole('reader')},
    allRolls: function() {
      var result = []
      this.roles.forEach((role)=>{
        if (this.$store.state.auth.confirmRole(role)) result.push(role)
      });
      return result;
    }
  },
  methods: {
    _is (role, for_current_book = false) {
      if (!for_current_book) {
        return this.$store.state.auth.confirmRole(role);
      } else {
        let session = this.$store.state.auth.getSession();
        if (this.$store.state.currentJobInfo && this.$store.state.currentJobInfo.executors && session && session.user_id) {
          return this.$store.state.currentJobInfo.executors[role] === session.user_id
        }
      }
      return false;
    },

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
