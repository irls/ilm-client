<template>
  <table class="navtable">
    <tr><td class='logo'>
      <router-link to="/"><img src="../assets/ilm-logo.svg"/></router-link>
    </td>
    <td class='menu'>
      <ul class="navlist">

        <router-link to="/books" tag='li'
        v-show="isAdmin || isEditor || isLibrarian"
        ><a>Books</a></router-link>

        <router-link to="/users" class='presentation' tag='li'
        v-show="isAdmin || isBookkeeper || isLibrarian"
        ><a>Users</a></router-link>

        <router-link to="/libraries" class='presentation' tag='li'
        v-show="isAdmin || isLibrarian"
        ><a>Libraries</a></router-link>

        <router-link to="/assignments" class='presentation' tag='li'
        v-show='true'><a>Assignments</a><sup>{{tc_userTasks.total}}</sup></router-link>

     </ul>
    </td>
    <td class='menu right'>
      <ul class="navlist">
          <!-- <router-link class="presentation" to="/help" tag='li'><a>Help</a></router-link></router-link> -->
          <!-- <router-link class="presentation" to="/contact" tag='li'><a>Contact</a></router-link> -->

          <li class="presentation roles">({{allRolls.join(', ')}})</li>

          <li v-if="$store.state.isLoggedIn" class="presentation"><a href="#" v-on:click.stop.prevent="$store.state.auth.logout()">Logout</a></li>
      </ul>
    </td></tr>
  </table>
</template>



<script>
import access from "../mixins/access.js"
import { mapGetters } from 'vuex'


export default {
  data () {
    return {
      // process: this.$store.state.process
    }
  },
  mixins: [access],
  computed: 
    mapGetters (['tc_userTasks'])
  
}
</script>



<style scoped>

  /* Navigation Menu Table (Oh yes I did!) */
  table.navtable {
   width: 100%; margin:0;
   margin-left:10px; margin-right:10px; margin-bottom: 1em; height: 5em;
   min-width: 768px; display: table;
   /*background: silver;
   border: .25 px solid gray;*/

  }
  .navtable tr {vertical-align: top; font-size: 1.2em; }
  .navtable td {vertical-align: top; text-align: left;}
  .navtable td.logo {min-width: 20px; width: 20px;}
    .logo img{max-width: 30px; margin:0; margin-left: -10px; margin-top: 2px; position: absolute;}
  .navtable td.menu {padding-left: 10px;}
  .navtable td.right {float: right; padding-right: 5px;}

  /* non-adaptive navigation list */
  .navlist { list-style-type: none; margin:0; padding:0; }
  .navlist li {display: block; overflow: hidden; text-align: center; float:left; padding: 15px;}
  /*.navlist li:hover {background: yellow}*/
  .navlist li.active {background: #eaf1fc}
  .navlist a {color: gray;}
  li.active a {color: black; text-decoration: none;}
  .navlist a:hover { text-decoration: none; }

  li.presentation.roles {font-size: .75em; padding: 10px; margin: 10px; color: gray; font-style: italic; }

</style>
