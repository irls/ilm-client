import axios from 'axios';
import lodash from 'lodash';

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
    }],
    various_authors: [
      {
        id: "various",
        name: "Various",
        slug: "",
        name_en: "Various",
        key: "various"
      },
      {
        id: "anonymous",
        name: "Anonymous",
        slug: "",
        name_en: "Anonymous",
        key: "anonymous"
      },
      {
        id: "unknown",
        name: "Unknown",
        slug: "",
        name_en: "Unknown",
        key: "unknown"
      }
    ]
  },
  getters: {
    author_link_arr: (state, getters, rootState) => {
      return state.author_link_arr;
    },
    various_authors: state => {
      return state.various_authors;
    },
    isVariousAuthor: state => (author) => {
      return state.various_authors.find(various_author => {
        return various_author.id === author.id;
      }) ? true : false;
    },
    authorsLangList: (state, getters, rootState) => (lang, bookLang) => {
      let authorsList = [];
      rootState.authorsModule.authors.forEach((author) => {
        const authorMapped = {
          id: author.id,
          slug: author.slug,
          key: author.id
        }
        let authorLang = lang === "en" ? lodash.cloneDeep(author) : author.name_lang.find((name_lang) => {
          return name_lang.language === lang;
        });
        let bookAuthor = bookLang === "en" ? lodash.cloneDeep(author) : author.name_lang.find((name_lang) => {
          return name_lang.language === bookLang;
        });
        if (authorLang && authorLang.name) {
          authorMapped.name = bookAuthor ? bookAuthor.name : "";
          if (lang === 'en') {
            authorMapped.name_en = bookLang === "en" ? "" : author.name;
            //authorMapped.alt_names = author.alt_names;
          } else {
            //author.name_lang = author.name_lang || [];
            authorMapped.name_en = author.name;
            //authorMapped.alt_names = authorLang ? authorLang.alt_names : author.alt_names;
          }
          authorsList.push(authorMapped);
          authorLang.verified_names.forEach((verifiedName, verifiedNameIdx) => {
            if (verifiedName && verifiedName.length > 0) {
              authorsList.push(lodash.assign(lodash.cloneDeep(authorMapped),
              {
                name: bookLang === lang ? verifiedName : (bookAuthor ? bookAuthor.name : ""),
                name_en: bookLang === "en" ? "" : (lang === "en" ? verifiedName : author.name),
                key: `${author.id}_${verifiedNameIdx}`
              }));
            }
          });
        }
      });
      return authorsList;
    }
  },
  mutations: {

    set_authorsList(state, authorsListData) {
      const lang = authorsListData.lang || 'en';
      let authorsListArr = [];
      authorsListData.data.forEach((author) => {
        const authorMapped = {
          id: author.id,
          slug: author.slug,
          key: author.id
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
        authorsListArr.push(authorMapped);
        author.verified_names.forEach((verifiedName, verifiedNameIdx) => {
          authorsListArr.push(lodash.assign(lodash.cloneDeep(authorMapped), 
          { 
            name: lang === "en" ? verifiedName : authorMapped.name, 
            name_en: lang === "en" ? authorMapped.name : verifiedName,
            key: `${author.id}_${verifiedNameIdx}` 
          }));
        });
      });
      state.author_link_arr = authorsListArr;
      this.commit('authorsMapModule/add_variousAuthors');
    },

    add_variousAuthors(state) {
      state.author_link_arr = state.author_link_arr.concat(state.various_authors);
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
