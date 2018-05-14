import Vue from 'vue'
import Router from 'vue-router'

import Books from '../components/Books'

import BooksGrid from '../components/books/BooksGrid'
import BookEdit from '../components/books/BookEdit'
import BookEditDisplay from '../components/books/BookEdit_Display'

import Users from '../components/Users'
import Libraries from '../components/Libraries'
import Tasks from '../components/Tasks'
import Help from '../components/Help'
import Contact from '../components/Contact'
import Align from '../components/Align'
import AudioEditor from '../components/AudioEditor'
import Collections from '../components/Collections'

Vue.use(Router)

// const NotFound = { template: '<p>Page not found</p>' }

export default new Router({
  mode: 'history',
  linkActiveClass: 'active',
  routes: [
    {
      path: '/books',
      component: Books,
      children: [
        { path: '', component: BooksGrid }
      ]
    },
    {
      path: '/books/:bookid',
      component: Books,
      children: [
        { path: '', component: BooksGrid },
        {
          path: 'edit/:block?/:task_type?', name: 'BookEdit',
          component: BookEdit, meta: { mode: 'edit' }, props: { mode: 'edit' }
        },
        {
          path: 'display/:block?', name: 'BookEditDisplay',
          component: BookEditDisplay, meta: { mode: 'edit' }
        },
        {
          path: 'narrate', name: 'BookNarrate',
          component: BookEdit, meta: { mode: 'narrate' }, props: { mode: 'narrate' }
        }
      ]
    },
//     {
//       path: '/books/edit/:bookid',
//       component: Books
//     },

    {
      path: '/users',
      component: Users
    },
    {
      path: '/libraries',
      component: Libraries
    },
    {
      path: '/libraries/:libraryid',
      component: Libraries
    },
    {
      path: '/library-books',
      component: Libraries
    },
    {
      path: '/assignments',
      component: Tasks
    },
    {
      path: '/help',
      component: Help
    },
    {
      path: '/contact',
      component: Contact
    },
    {
      path: '/align',
      component: Align
    },
    {
      path: '/audio_editor',
      component: AudioEditor
    },
    {
      path: '/collections',
      component: Collections
    },
    {
      path: '/collections/:collectionid',
      component: Collections
    },
    {
      path: '/collections/:collectionid/:bookid',
      component: Collections
    },
    {
      path: '/collections/:collectionid/:bookid/edit',
      component: Collections
    },
    { path: '*', redirect: '/books' }
  ]
})
