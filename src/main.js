import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import 'normalize.css'

Vue.use(ElementUI)

Vue.config.productionTip = false

Vue.filter("typeColor", function(value) {
  let color = ''
  switch(value) {
    case 'chi':
      color = '#67C23A'
      break
    case 'jp':
      color = '#E6A23C'
      break
    case 'kr':
      color = '#F56C6C'
      break
    case 'tai':
      color = '#909399'
      break
    case 'west':
      color = '#109399'
      break
    default:
      color = '#fff'
      break
  }
  return color
})

Vue.filter("typeText", function(value) {
  const types = {
    kr: '韓式',
    jp: '日式',
    tai: '泰式',
    chi: '中式',
    west: '西式'
  }
  return types[value]
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
