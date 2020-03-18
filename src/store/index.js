import Vue from 'vue'
import Vuex from 'vuex'
import dishes from './dishes.json'
import { uuid } from './utils'
Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    types: {
      kr: '韓式',
      jp: '日式',
      tai: '泰式',
      chi: '中式',
      west: '西式'
    },
    dishes: dishes,
    recommends: [{}, {}, {}, {}, {}],
    leftDishes: []
  },
  mutations: {
    setDishes(state, data) {
      state.dishes = data
    },
    addDish(state, data) {
      state.dishes.push({id: uuid(), ...data})
    },
    deleteDish(state, id) {
      const index = state.dishes.findIndex(i => i.id === id)
      state.dishes.splice(index, 1)
    },
    setRecommend(state, recommends) {
      state.recommends = recommends
    },
    setLeftDishes(state, leftDishes) {
      state.leftDishes = leftDishes
    }
  },
  actions: {
    getDishes({ commit }) {
      commit('setStation', {})
    },
    addDish({ commit }, { data }) {
      commit('addDish', data)
    },
    deleteDish({ commit }, { id }) {
      commit('deleteDish', id)
    },
    setRecommend({ commit }, { recommends }) {
      commit('setRecommend', recommends)
    },
    setLeftDishes({ commit }, { leftDishes }) {
      commit('setLeftDishes', leftDishes)
    }
  },
  getters: {
    dishes: state => state.dishes.sort((a, b) => a.price - b.price),
    types: state => state.types,
    recommends: state => state.recommends,
    leftDishes: state => state.leftDishes
  },
  modules: {
  }
})
