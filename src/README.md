## SRC Organization

* Top-level screens and components are .vue files directly inside /src/components
  * For example: Books.vue, Users.vue

* Each top-level component has one corresponding directory containing sub-components
  * For example: components/books/, components/users/  

* One directory components/generic/ contains any reuseable components
  * For example: ButtonRadioGroup.vue, Grid.vue, ContextMenu.vue

* Other top-level directories include:
  * router (top-level router)
  * store (vuex)
  * static & assets (static site-wide files such as favicon)

