export default {
  computed: {
    isAdmin: function() {return this.$store.state.auth.confirmRole('admin')},
    isEditor:  function() {return this.$store.state.auth.confirmRole('editor')},
    isLibrarian: function() {return this.$store.state.auth.confirmRole('librarian')},
    isBookkeeper: function() {return this.$store.state.auth.confirmRole('bookkeeper')},
    allRolls: function() {
      var result = []
      if (this.$store.state.auth.confirmRole('admin')) result.push('admin')
      if (this.$store.state.auth.confirmRole('editor')) result.push('editor')
      if (this.$store.state.auth.confirmRole('librarian')) result.push('librarian')
      if (this.$store.state.auth.confirmRole('bookkeeper')) result.push('bookkeeper')
      return result;
    }
  }
}
