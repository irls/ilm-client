function filteredData (data, filterKey) {
  var filterKeyString = filterKey && filterKey.toLowerCase()
  var results = data
  if (filterKeyString) {
    results = results.filter(row => {
      return Object.keys(row).some(key => {
        return String(row[key]).toLowerCase().indexOf(filterKeyString) > -1
      })
    })
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
