import axios from 'axios';

export default {
  namespaced: true,
  state: {
    author_link_arr: [{
      id: '1',
      name: 'Lewis Carroll',
      name_en: 'Lewis Carroll',
      slug: 'lewis-carroll',
      name_lang: [
        {
          language: "ar",
          name: "Milner senior",
          alt_names: ["Johny","Milner"]
        }
      ],
      alt_names: ['Lewis C. Carroll', 'Lewis K. Carroll'],
      language: 'en'
    }]
  },
  getters: {
    author_link_arr: state => state.author_link_arr
  },
  mutations: {

    set_authorsList(state, authorsListData) {
      const lang = authorsListData.lang || 'en';
      const authorsListArr = authorsListData.data.map((author)=>{
        const authorMapped = {
          id: author.id,
          slug: author.slug
        }
        if (lang === 'en') {
          authorMapped.name = author.name;
          authorMapped.name_en = author.name;
          authorMapped.alt_names = author.alt_names;
        } else {
          author.name_lang = author.name_lang || [];
          const author_local = author.name_lang.filter((name_lang)=>name_lang.language === lang);
          authorMapped.name = author_local.length ? author_local[0].name : author.name;
          authorMapped.name_en = author.name;
          authorMapped.alt_names = author_local.length ? author_local[0].alt_names : author.alt_names;
        }
        return authorMapped;
      })
      state.author_link_arr = authorsListArr;
      console.log(`${__filename.substr(-30)}::state.author_link_arr: `, state.author_link_arr);
    }

  },
  actions: {
    async getAuthorsList({commit, state, rootState}, params = {}) {
      let url = rootState.API_URL + `authors`;
      if (params.lang) {
        url += '/'+params.lang;
      }

      try {
        var authorsListResp = await axios.get(url);
        commit('set_authorsList', {
          data: authorsListResp.data,
          lang: params.lang || 'en'
        });
      } catch (err) {
        console.log('Error:', (err.message || err));
      }

    }
  }
}
