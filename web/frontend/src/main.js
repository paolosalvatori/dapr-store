// ----------------------------------------------------------------------------
// Copyright (c) Ben Coleman, 2020
// Licensed under the MIT License.
//
// Dapr Store frontend - main app initialization and startup
// ----------------------------------------------------------------------------

import Vue from 'vue'
import VueRouter from 'vue-router'
import Axios from 'axios'
import App from './App.vue'
import auth from './mixins/auth'

// Use Vue Bootstrap and theme
import BootstrapVue from 'bootstrap-vue'
Vue.use(BootstrapVue)
import 'bootswatch/dist/materia/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// Set up FontAwesome
import { library as faIcons } from '@fortawesome/fontawesome-svg-core'
import { faUser, faUserPlus, faShoppingBasket, faTrophy, faIdCard, faShoppingCart, faSignOutAlt, faTrashAlt, faRedoAlt, faSearch, faPlusCircle, faMinusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
faIcons.add(faUser, faUserPlus, faShoppingBasket, faTrophy, faIdCard, faShoppingCart, faSignOutAlt, faTrashAlt, faRedoAlt, faSearch, faPlusCircle, faMinusCircle)
Vue.component('fa', FontAwesomeIcon)

// And client side routes (held in router.js)
import router from './router'
Vue.use(VueRouter)

// Let's go!
appStartup()

//
// Most of the app config & initialization moved here
// So it can be synchronized with the config API call
//
async function appStartup() {
  // Load config at runtime from special `/config` endpoint on frontend-host
  let config = {}
  try {
    let resp = await Axios.get('/config')
    config = resp.data
  } catch (err) {
    console.warn('### Failed to fetch \'/config\' endpoint. Defaults will be used')
    config = {
      API_ENDPOINT: '/',
      AUTH_CLIENT_ID: ''
      //AUTH_CLIENT_ID: '69972365-c1b6-494d-9579-5b9de2790fc3'
    }
  }

  console.log('### Config:', config)
  Vue.prototype.$config = config

  // MSAL config used for signing in users with MS identity platform
  if (config.AUTH_CLIENT_ID) {
    console.log(`### Azure AD sign-in: enabled. Using clientId: ${config.AUTH_CLIENT_ID}`)
    auth.methods.authInitMsal(config.AUTH_CLIENT_ID)
  } else {
    console.log('### Azure AD sign-in: disabled. Will run in demo mode')
  }

  // Re-login any stored user if there is one
  if (auth.methods.authStoredUsername()) {
    try {
      // Try to refresh the token for the stored user
      // If it fails - remove the stored local user forcing a re-login again
      await auth.methods.authLogin(false)
    } catch (err) {
      auth.methods.authUnsetUser()
    }
  }

  // Actually mount & start the Vue app
  new Vue({
    router,
    render: (h) => h(App),
  }).$mount('#app')
}