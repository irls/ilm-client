
export default {
  namespaced: true,
  state: {
    authorsArr: [{
      id: '1',
      name: 'Lewis Carroll',
      slug: 'lewis-carroll',
      name_en: 'Lewis Carroll',
      aliases: ['Lewis C. Carroll', 'Lewis K. Carroll']
    }, {
      id: '2',
      name: 'Robert Louis Stevenson',
      slug: 'robert-louis-stevenson',
      name_en: 'Robert Louis Stevenson',
      aliases: ['Robert L. Stevenson', 'R. L. Stevenson']
    }]
  },
  getters: {
    authorsArr: state => state.authorsArr
  },
  mutations: {},
  actions: {}
}
