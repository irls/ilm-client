export default {
  namespaced: true,
  state: {
    multiBookFilters: {
      language: [],
      jobStatus: [{caption: 'Active', value: 'active'}],
      importStatus: [],
      multiProjectTag: []
    },

    mapFilterJobStatus: [
      {caption: 'Active',    value: 'active'},
      {caption: 'Archived',  value: 'archived'},
      {caption: 'Completed', value: 'completed'},
      {caption: 'Suspended', value: 'suspended'}
    ],

    mapFilterImportStatus: [
      {caption: 'No content',   value: 'staging_empty'},
      {caption: 'Text Cleanup', value: 'staging'},
      {caption: 'Narration',    value: 'narrating'},
      {caption: 'Proofreading', value: 'proofing'},
      {caption: 'Mastering',    value: 'mastering'},
      {caption: 'Done',         value: 'completed'}
    ],

    mapFilterProjectTag: [
      {caption: 'Reader',  value: 'Reader'},
      {caption: 'Ocean',   value: 'Ocean'},
      {caption: 'ST',      value: 'ST'},
      {caption: 'OOL',     value: 'OOL'},
      {caption: 'Testing', value: 'Testing'},
      {caption: 'Traning', value: 'Traning'},
    ],
  },
  getters: {
    multiBookFilters:      state=>state.multiBookFilters,
    mapFilterJobStatus:    state=>state.mapFilterJobStatus,
    mapFilterImportStatus: state=>state.mapFilterImportStatus,
    mapFilterProjectTag:   state=>state.mapFilterProjectTag,
  },
  mutations: {
    multiBookFilters(state, payload) {
      state.multiBookFilters = payload;
    }
  },
  actions: {}
}
