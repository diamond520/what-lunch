<template>
  <div id="app">
    <el-container>
      <el-header id="header">
        <router-link to="/">
          <span>午餐吃什麼</span>
        </router-link>
        <router-link class="float-btn" to="/dishes">
          <el-link icon="el-icon-edit" :underline="false">編輯菜單</el-link>
        </router-link>
      </el-header>
      <el-container>
        <el-main>
          <router-view/>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script>
export default {
  methods: {
    gotoEdit() {
      this.$router.push({name: 'dishes'})
    }
  }
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
.el-header, .el-footer {
  background-color: #87C241;
  color: #fff;
  font-size: 1.25em;
  text-align: center;
  line-height: 60px;
}
#header {
  .float-btn {
    float: right;
  }
  a {
    color: #fff;
    text-decoration: none;
    &:visited {
      color: #fff;
    }
  }
}

</style>
