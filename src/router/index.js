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
import CollectionsGrid from '../components/collections/CollectionsGrid';
import Settings from '../components/Settings'
import TestAudioConvert from '../components/audio/TestAudioConvert';


Vue.use(Router)

// const NotFound = { template: '<p>Page not found</p>' }

export default new Router({
  mode: 'history',
  linkActiveClass: 'active',
  routes: [
    {
      path: '/books',
      component: Books,
      props: {},
      children: [
        { path: '', name: 'Books', component: BooksGrid }
      ]
    },
    {
      path: '/books/:bookid',
      component: Books,
      props: {},
      children: [
        { path: '', name: 'BooksGrid', component: BooksGrid, props: {} },
        {
          path: 'edit/:block?/:task_type?', name: 'BookEdit',
          component: BookEdit, meta: { mode: 'edit' }, props: { mode: 'edit' }
        },
        {
          path: 'display/:block?/:task_type?', name: 'BookEditDisplay',
          component: BookEditDisplay, meta: { mode: 'edit' }, props: {}
        },
        {
          path: 'narrate/:block?/:task_type?', name: 'BookNarrate',
          component: BookEdit, meta: { mode: 'narrate' }, props: { mode: 'narrate' }
        },
        {
          path: 'proofread/:block?/:task_type?', name: 'BookProofread',
          component: BookEdit, meta: { mode: 'proofread' }, props: { mode: 'proofread' }
        }
      ]
    },
    {
      path: '/collections',
      component: Books,
      props: {},
      children: [
        {
          path: '',
          name: 'Collections',
          component: CollectionsGrid
        },
        {
          path: ':collectionid',
          name: 'Collection',
          component: CollectionsGrid,
        },
        {
          path: 'books/:collectionid',
          name: 'CollectionBooks',
          component: Collections,
        },
        {
          path: 'books/:collectionid/:bookid',
          name: 'CollectionBook', component: Collections
        },
//         {
//           path: '/collections/:collectionid/:bookid/edit/:block?/:task_type?', name: 'CollectionBookEdit',
//           component: BookEdit, meta: { mode: 'edit' }, props: { mode: 'edit' }
//         },
//         {
//           path: '/collections/:collectionid/:bookid/display/:block?', name: 'CollectionBookEditDisplay',
//           component: BookEditDisplay, meta: { mode: 'edit' }
//         },
//         {
//           path: '/collections/:collectionid/:bookid/narrate/:block?/:task_type?', name: 'CollectionBookNarrate',
//           component: BookEdit, meta: { mode: 'narrate' }, props: { mode: 'narrate' }
//         },
//         {
//           path: '/collections/:collectionid/:bookid/proofread/:block?/:task_type?', name: 'CollectionBookProofread',
//           component: BookEdit, meta: { mode: 'proofread' }, props: { mode: 'proofread' }
//         }
      ]
    },
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
      name: 'Assignments',
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
      path: '/settings',
      component: Settings
    },
    {
      path: '/test_audio_convert',
      component: TestAudioConvert
    },
    { path: '*', redirect: '/books' }
  ]
})
