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
        console.log("Cannot get library instance until logged in! ")
        return false
      }
      //console.log('db: ', this.$store.state.auth.getDbUrl('ilm_library'))
      return new PouchDB(this.$store.state.auth.getDbUrl('ilm_library'))
    },

  }
}
