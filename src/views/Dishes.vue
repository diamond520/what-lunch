<template>
  <div>
    <el-divider>
      <el-button type="success" round icon="el-icon-dish" @click="openAddDishDrawer">新增餐廳{{ `(${dishes.length})` }}</el-button>
    </el-divider>
    <el-table
      ref="filterTable"
      :data="dishes"
      :default-sort = "{prop: 'name', order: 'descending'}"
      height="450"
      style="width: 100%">
      <el-table-column
        prop="name"
        sortable
        label="餐廳">
      </el-table-column>
      <el-table-column
        prop="price"
        sortable
        label="價位">
      </el-table-column>
      <el-table-column
        prop="distance"
        sortable
        label="距離">
      </el-table-column>
      <el-table-column
        prop="type"
        sortable
        label="類型">
        <template slot-scope="scope">
          <el-tag
            effect="dark"
            :hit="true"
            :type="'primary'"
            :color="scope.row.type | typeColor"
            disable-transitions>{{scope.row.type | typeText}}</el-tag>
        </template>
      </el-table-column>
      <el-table-column
        fixed="right"
        label="操作">
        <template slot-scope="scope">
          <el-link
            @click.native.prevent="deleteRow(scope.row.id)"
            type="danger"
            size="small"
            width="400px">
            移除
          </el-link>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer
      ref="drawer"
      title="新增餐廳"
      :visible.sync="drawer"
      :direction="'btt'"
      size="70%"
      :before-close="handleClose">
      <el-col :xs="{span: 23}" :sm="{span: 12, offset: 6}">
        <el-form ref="form" :model="form" :rules="rules" label-width="80px">
          <el-form-item label="名稱" prop="name">
            <el-input v-model="form.name"></el-input>
          </el-form-item>
          <el-form-item label="類型" prop="type">
            <el-select v-model="form.type" placeholder="餐廳類型">
              <el-option v-for="(item, i) in types" :key="i" :value="i" :label="item"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="價位" prop="price">
            <el-input v-model="form.price" type="number">
              <template slot="append">元</template>
            </el-input>
          </el-form-item>
          <el-form-item label="距離" prop="distance">
            <el-input v-model="form.distance" type="number">
              <template slot="append">公尺</template>
            </el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="onSubmit">新增</el-button>
            <el-button>取消</el-button>
          </el-form-item>
        </el-form>
      </el-col>
    </el-drawer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  data() {
    return {
      form: {
        name: '',
        distance: '',
        price: '',
        type: ''
      },
      rules: {
        name: [
          { required: true, message: '請輸入名稱', trigger: 'blur' }
        ],
        distance: [
          { required: true, message: '請輸入距離', trigger: 'blur' }
        ],
        price: [
          { required: true, message: '平均價位', trigger: 'blur' }
        ],
        type: [
          { required: true, message: '請選擇餐廳類型', trigger: 'change' }
        ]
      },
      visible: [],
      drawer: false,
    }
  },
  computed: {
    ...mapGetters([
      'dishes',
      'types'
    ])
  },
  methods: {
    openAddDishDrawer() {
      this.drawer = true
    },
    deleteRow(id) {
      this.$store.dispatch('deleteDish', { id: id })
    },
    handleClose(done) {
      done()
    },
    onSubmit() {
      this.$refs['form'].validate((valid) => {
        if (valid) {
          // alert('submit!')
          this.$store.dispatch('addDish', {data: this.form})
          this.resetForm()
          this.$refs.drawer.closeDrawer()
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    resetForm() {
      this.$refs['form'].resetFields()
    }
  }
}
</script>

<style lang="scss" scoped>
.el-divider--horizontal {
  margin: 40px 0;
}
.el-select {
  width: 100%;
}
</style>
