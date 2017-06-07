function filteredData (data, filterKey, filters) {
  var filterKeyString = filterKey && filterKey.toLowerCase()
  var results = data
  if (filterKeyString) {
    results = results.filter(row => {
      return Object.keys(row).some(key => {
        return String(row[key]).toLowerCase().indexOf(filterKeyString) > -1
      })
    })
  }
  if (filters) {
    for (var filter in filters) {
      if (typeof filters[filter] !== 'undefined' && filters[filter] !== '') {
        results = results.filter(row => {
          return row[filter] == filters[filter]
        })
      }
    }
  }
  
  return results
}

function pagedData (data, currentPage, rowsPerPage) {
  return data.slice(
    currentPage * rowsPerPage,
    rowsPerPage * (currentPage + 1)
  )
}


export { filteredData, pagedData }
