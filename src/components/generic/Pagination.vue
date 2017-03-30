<template>
  <div class="row" v-if="noPages.length > 1">
    <div class="text-center">
      <ul class="pagination">
        <li :class="{disabled: (currentPage === 0)}"><a href="#" @click="goToPage(-1, $event)">Previous</a></li>
        <template>
          <li v-for="page in noPages" :class="{active: page === currentPage}">
            <a href="#" @click="goToPage(page - currentPage, $event)">{{page + 1}}</a>
          </li>
        </template>
        <li :class="{disabled: (currentPage + 1 === noPages.length)}"><a href="#" @click="goToPage(1, $event)">Next</a></li>
      </ul>
    </div>
  </div>
</template>

<script>

export default {

  name: 'Pagination',

  props: {
    length: Number,
    currentPage: {
      type: Number,
      default: 0,
      twoWay: true
    },
    rowsPerPage: Number
  },

  computed: {

    noPages () { // No. pages as an array. Used for rendering paginator
      let pages = Math.ceil(this.length / this.rowsPerPage)
      return [...Array(pages).keys()]
    }

  },

  methods: {

    goToPage (pageChange, e) {
      e.preventDefault()
      const pageChanged = this.currentPage + pageChange
      if (pageChanged < 0 || pageChanged >= this.length / this.rowsPerPage) return
      this.$emit('goToPage', pageChanged)
    }

  }

}
</script>
