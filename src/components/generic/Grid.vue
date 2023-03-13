<!--
Generic table view based on bootstrap styles
Features:
  * Filtering on all keys
  * Pagination
  * Sorting and reverse sorting on any key
  * Optional custom renderers for individual columns
-->
<template>
  <div ref="grid_component_ref">
  <table class="table table-striped table-bordered table-hover" v-if="!draggable">
    <thead>
      <tr>
        <th v-for="key in columns"
          @click="sortBy(key.path)"
          :class="[key.addClass, { act: sortKey == key.path}]"
          >{{ key.title }}<span class="arrow" :class="sortOrders[key.path] > 0 ? 'asc' : 'dsc'"></span></th>
      </tr>
    </thead>
    <tbody>
    <!--  {{ key.render(entry[key.path]) }} -->
      <tr v-for="(entry, index) in limitedData" @click="rowEvent(entry, $event, index)" class="grid-row" :data-id="entry[idField]" :class='[{selected : isSelected(entry[idField])}, {"status-archived": entry.job_status === "archived"}]' >
        <td v-for="key in columns" :class="[key.addClass]" class="grid-cell">
          <template v-if="key.render">{{ key.render(entry[key.path]) }}</template>
          <template v-else-if="key.html"> <span v-html="key.html(entry[key.path])"></span> </template>
          <template v-else> {{entry[key.path]}} </template>
        </td>
      </tr>
      <tr v-if="isLoading">
        <td :colspan="columns.length" class="text-center noData">
          <i class="fa fa-spinner fa-spin"></i>
        </td>
      </tr>
      <tr v-if="!isLoading && !data.length">
        <td :colspan="columns.length" class="text-center noData">
          {{emptyTableText}}
        </td>
      </tr>
    </tbody>
  </table>
  <table class="table table-striped table-bordered table-hover" v-else>
    <thead>
      <tr v-if="sortable">
        <th v-for="key in columns"
          @click="sortBy(key.path)"
          :class="[key.addClass, { act: sortKey == key.path}]"
          >{{ key.title }}<span class="arrow" :class="sortOrders[key.path] > 0 ? 'asc' : 'dsc'"></span></th>
      </tr>
      <tr v-else>
        <th v-for="key in columns"
          :class="[key.addClass]"
          >{{ key.title }}</th>
      </tr>
    </thead>
    <draggable tag="tbody" @end="endMove" ref="draggable" :move="checkMove" v-model="limitedData">
    <!--  {{ key.render(entry[key.path]) }} -->
      <tr v-for="(entry, index) in limitedData" @click="rowEvent(entry, $event, index)" class="grid-row" :data-id="entry[idField]" :class='[{selected : isSelected(entry[idField])}, {"status-archived": entry.job_status === "archived"}]' >
        <td v-for="key in columns" :class="[key.addClass]" class="grid-cell">
          <template v-if="key.render">{{ key.render(entry[key.path]) }}</template>
          <template v-else-if="key.html"> <span v-html="key.html(entry[key.path])"></span> </template>
          <template v-else> {{entry[key.path]}} </template>
        </td>
      </tr>
      <tr v-if="isLoading">
        <td :colspan="columns.length" class="text-center noData">
          <i class="fa fa-spinner fa-spin"></i>
        </td>
      </tr>
      <tr v-if="!isLoading && !data.length">
        <td :colspan="columns.length" class="text-center noData">
          {{emptyTableText}}
        </td>
      </tr>
    </draggable>
  </table>
    <div class="row" v-if="noPages.length > 1">
      <div class="text-center">
        <ul class="pagination">
          <li :class="{disabled: (currentPage === 0)}"><a href="#" @click="previous">Previous</a></li>
          <template>
            <li v-for="page in noPages" :class="{active: page === currentPage}">
              <a href="#" @click="goToPage(page, $event)">{{page + 1}}</a>
            </li>
          </template>
          <li :class="{disabled: (currentPage + 1 === noPages.length)}"><a href="#" @click="next">Next</a></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
  import draggable    from 'vuedraggable';
  import Tooltip      from 'primevue/tooltip';
  import Vue          from 'vue';
  export default {
    props: {
      data: Array, // Unfiltered table data
      columns: Array, // List of columns ['title', 'description']
      filterKey: String, // String to filter on ''
      customEmptyTableText: '', // optional text override for empty table
      rowsPerPage: Number, // Number of rows per page of results
      isLoading: false,
      idField: String, // name of field to used as a unique id
      selected: Array, // list of,
      draggable: false,
      sortable: true
    },
    components: {
      draggable: draggable
    },
    data () {
      let sortOrders = {}
      this.columns.forEach(key => {
        sortOrders[key.path] = 1
      })
      return {
        sortKey: '',
        sortOrders: sortOrders,
        currentPage: 0,
        dblClickTimer: null,
        dblClickIndex: false
      }
    },
    watch: {
      'filterKey' (a, b) { // Reset to page 0 when search changes
        this.currentPage = 0
      },
      'rowsPerPage' (a, b) { // Reset to page 0 when items per page changes
        this.currentPage = 0
      }
    },
    mounted() {
      const hasTooltipElements = (this.$refs.grid_component_ref).querySelectorAll('[data-tooltip]');
      if (hasTooltipElements.length) {
        for (let el of hasTooltipElements) {
          Tooltip.bind(el, {value: el.dataset.tooltip, modifiers: {top: true}});
        }
      }
    },
    beforeUpdate() {
      const hasTooltipElements = (this.$refs.grid_component_ref).querySelectorAll('[data-tooltip]');
      if (hasTooltipElements.length) {
        for (let el of hasTooltipElements) {
          try {
            Tooltip.unbind(el);
          } catch(err) {}
        }
      }
    },
    updated() {
      const hasTooltipElements = (this.$refs.grid_component_ref).querySelectorAll('[data-tooltip]');
      if (hasTooltipElements.length) {
        for (let el of hasTooltipElements) {
          Tooltip.bind(el, {value: el.dataset.tooltip, modifiers: {top: true}});
        }
      }
    },
    computed: {
      noPages () { // No. pages as an array. Used for rendering paginator
        let pages = Math.ceil(this.filteredData.length / this.rowsPerPage)
        return [...Array(pages).keys()]
      },
      emptyTableText () { // Default text shown when there's no data in the table
        if (this.customEmptyTableText) {
          return this.customEmptyTableText
        } else {
          return 'No data to show'
        }
      },
      filteredData () { // Data filtered through the local search
        var sortKey = this.sortKey
        var filterKey = this.filterKey && this.filterKey.toLowerCase()
        var order = this.sortOrders[sortKey] || 1
        var data = this.data
        if (filterKey) {
          data = data.filter(row => {
            return Object.keys(row).some(key => {
              return String(row[key]).toLowerCase().indexOf(filterKey) > -1
            })
          })
        }
        if (sortKey) { // If sort specified, sort
          data = data.slice().sort((a, b) => {
            a = a[sortKey]
            b = b[sortKey]
            return (a === b ? 0 : a > b ? 1 : -1) * order
          })
        }
        return data
      },
      limitedData () { // Data limited to a page
        return this.filteredData.slice(
          this.currentPage * this.rowsPerPage,
          this.rowsPerPage * (this.currentPage + 1)
        )
      }
    },
    methods: {
      sortBy (key) { // header row click handler. Sort by column
        this.sortKey = key
        this.sortOrders[key] = this.sortOrders[key] * -1
      },
      rowEvent (entry, event, index = 0) { // Event broadcase from table with clicked element
        if (this.dblClickIndex !== false && this.dblClickIndex === index) {
          this.dblClickIndex = false;
          clearTimeout(this.dblClickTimer);
          this.$emit('dblClickRow', entry, event);
          return true;
        }
        this.dblClickIndex = index;
        if (this.dblClickTimer) clearTimeout(this.dblClickTimer);
        this.dblClickTimer = setTimeout(() => {
          this.dblClickIndex = false;
        }, 300)

        this.$emit('clickRow', entry, event);
        return true;
      },
      previous (e) { // Previous page click handler
        e.preventDefault()
        if (this.currentPage !== 0) {
          --this.currentPage
        }
      },
      next (e) { // Next page click handler
        e.preventDefault()
        if (this.currentPage + 1 !== this.noPages.length) {
          ++this.currentPage
        }
      },
      goToPage (page, e) { // Go to a specific page click handler
        e.preventDefault()
        this.currentPage = page
      },
      isSelected (id) {
        return (this.selected.indexOf(id) > -1)
      },
      isVisible (id) {
        // console.log ('limiteddata: ', this.computed.limitedData)
      },
      endMove(event) {
        this.$emit('orderChanged', {to: event.newIndex, from: event.oldIndex});
      },
      checkMove () {
        //console.log('CHECK MOVE', arguments);
        return true;
      },
      getEntry(entry, key) {
        return (entry[key.path] && entry[key.path].length) ? entry[key.path] : (key.altPath ? entry[key.altPath] : '');
      }
    }
  }
</script>

<style scoped>
  .grid-row {
    cursor: pointer;
  }
  th {
    cursor: pointer;
  }
  th, td {
    padding: 10px 20px;
  }
  th.act {
    color: #fff;
    background: gray;
  }
  th.act .arrow {
    opacity: 1;
  }
  .arrow {
    display: inline-block;
    vertical-align: middle;
    width: 0;
    height: 0;
    margin-left: 5px;
    opacity: 0.66;
  }
  .arrow.asc {
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-bottom: 4px solid #fff;
  }
  .arrow.dsc {
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-top: 4px solid #fff;
  }
  th {vertical-align: top !important;}
  .grid-row.status-archived {
    color: gray;
  }
</style>
