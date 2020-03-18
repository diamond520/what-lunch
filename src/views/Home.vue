<template>
  <div class="home">
    <div>
      一週預算：
      <el-input-number v-model="price" :step="10" @change="handleChange" :min="100" :max="2000" label="一週預算"></el-input-number>
      元
    </div>
    <el-divider>
      <el-button type="success" round icon="el-icon-dish" @click="recommend">一鍵推薦</el-button>
    </el-divider>
    <div class="weekly">
      <el-row :gutter="20">
        <el-col v-for="(dish, i) in recommends" :key="i" :xs="{span: 24}" :sm="{span: 4, offset: i == 0 ? 2 : 0}">
          <el-card>
            <div slot="header" class="clearfix">
              <span>星期{{ i + 1 }}</span>
            </div>
            <div v-if="dish.name">
              <div class="item">
                {{ dish.name }}
              </div>
              <div class="item">
                <el-tag
                  effect="dark"
                  :hit="true"
                  :type="'primary'"
                  :color="dish.type | typeColor"
                  disable-transitions>{{dish.type | typeText}}</el-tag>
              </div>
              <div class="item">
                {{ `$${dish.price}` }}
              </div>
              <div class="item">
                {{ `距離：${dish.distance}m` }}
              </div>
              <el-button type="button" icon="el-icon-refresh" circle @click="recommendSingle(i)"></el-button>
            </div>
            <i v-else class="el-icon-question"></i>
          </el-card>
        </el-col>
      </el-row>
      <!-- <div>{{recommends.length}} : {{leftDishes.length}}</div> -->
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
// import HelloWorld from '@/components/HelloWorld.vue'
import { mapGetters } from 'vuex'

export default {
  name: 'Home',
  components: {
    // HelloWorld
  },
  data() {
    return {
      price: 500,
    }
  },
  computed: {
    ...mapGetters([
      'dishes',
      'recommends',
      'leftDishes'
    ])
  },
  methods: {
    handleChange() {
    },
    recommendSingle(index) {
      // console.log(index, this.recommends)
      const recommends = this.recommends.slice(0)
      const leftDishes = this.leftDishes.slice(0)
      let quota = this.price
      for(let i = 0 ; i < recommends.length ; i++) {
        if(i !== index) {
          quota -= recommends[i].price
        }
      }
      // console.log('quota', quota)
      if(leftDishes.length <=0) {
        this.$message({
          message: '找不到符合條件的餐廳',
          type: 'warning'
        })
        return
      }
      let targetIndex = leftDishes.findIndex(el => el.price <= quota)
      if(targetIndex < 0) {
        this.$message({
          message: '找不到符合條件的餐廳',
          type: 'warning'
        })
        return
      }
      recommends[index] = leftDishes[targetIndex]
      leftDishes.splice(targetIndex, 1)

      if(this.findMaxRepeat(recommends) <= 2) {
        this.$store.dispatch('setRecommend', {recommends: recommends})
        this.$store.dispatch('setLeftDishes', {leftDishes: leftDishes})
      } else {
        return this.recommendSingle(index)
      }
    },
    recommend() {
      let checkAtLeastOneSet = 0
      let variable = ''
      let kind = 0
      let i = 0

      while(kind >= 2 && i >= 4) {
        if(variable !== this.dishes[i].type) {
          variable = this.dishes[i].type
          kind += 1
        }
        checkAtLeastOneSet += this.dishes[i].price
        i =+ 1
      }
      if(this.price < checkAtLeastOneSet) {
        // 沒有低於 price 且不重複的組合
        return
      }
      const dishes = this.dishes.slice(0).sort((a, b) => a.price - b.price)
      const recommends = dishes.sort(() => Math.random() - 0.5).splice(0, 5).sort((a, b) => a.price - b.price)
      let {recommendDishes, allDishes, dropDishes} = this.checkTotalPrice(recommends, dishes, [])

      // 把最後結果排成不超過兩天重複
      recommendDishes = this.nonRepeatSort(recommendDishes)
      this.$store.dispatch('setRecommend', { recommends: recommendDishes })
      this.$store.dispatch('setLeftDishes', { leftDishes: allDishes.concat(dropDishes) })
    },
    nonRepeatSort(arr) {
      if(this.findMaxRepeat(arr) <= 2) {
        return arr
      } else {
        return this.nonRepeatSort(arr.sort(() => Math.random() - 0.5))
      }
    },
    findMaxRepeat(arr) {
      let type = arr[0].type
      let repeat = []
      let count = 1
      for(let i = 1 ; i < arr.length ; i++) {
        if(type === arr[i].type) {
          count += 1
        } else {
          repeat.push(count)
          count = 1
        }
        type = arr[i].type
      }
      repeat.push(count)
      return Math.max(...repeat)
    },
    checkTotalPrice(recommendDishes, allDishes, dropDishes) {
      recommendDishes.sort((a, b) => a.price - b.price)
      allDishes.sort(() => Math.random() - 0.5)
      const { sum, kind } = this.dishesArraySum(recommendDishes)
      if(sum <= this.price && kind >= 2) {
        return {
          recommendDishes: recommendDishes,
          allDishes: allDishes,
          dropDishes: dropDishes
        }
      } else {
        dropDishes.push(recommendDishes.pop())
        recommendDishes.push(allDishes.pop())
        return this.checkTotalPrice(recommendDishes, allDishes, dropDishes)
      }
    },
    dishesArraySum(arr) {
      let sum = 0
      let variable = ''
      let kind = 0
      for(let i = 0 ; i < arr.length ; i++) {
        if(variable !== arr[i].type) {
          variable = arr[i].type
          kind += 1
        }
        sum += arr[i].price
      }
      return {sum, kind}
    }
  }
}
</script>

<style lang="scss" scoped>
.home {
  .weekly {
    margin: 10px;
    .el-icon-question {
      font-size: 2em;
    }
  }
  .el-divider--horizontal {
    margin: 50px 0;
  }
  .el-col {
    margin-bottom: 20px;
    margin-top: 10px;
  }
  .item {
    margin-bottom: 18px;
  }
  .clearfix:before,
  .clearfix:after {
    display: table;
    content: "";
  }
  .clearfix:after {
    clear: both
  }
}
</style>