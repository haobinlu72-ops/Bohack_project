<template>
  <div class="list-container">
    <!-- 商品列表视图 -->
    <div v-if="!showUsers">
      <h1>本周待办事项</h1>
      <div class="add-item-form">
        <input
          type="text"
          v-model="newItemName"
          placeholder="请输入商品名称"
          @keyup.enter="addItem"
        />
        <button class="add-btn" @click="addItem">添加事项</button>
        <!-- 新增：清空列表按钮 -->
        <button class="clear-btn" @click="clearList">清空列表</button>
        <button class="toggle-btn" @click="toggleView">查看用户列表</button>
      </div>

      <!-- 商品列表展示 -->
      <!-- 外层容器用于 Flex 布局 -->
      <div v-for="(item, index) in items" :key="index" class="item-row">
        <!-- 商品名称 -->
        <div class="item-name">{{ index + 1 }}. {{ item }}</div>
        <!-- 删除按钮 -->
        <button class="remove-btn" @click="removeItem(index)">删除</button>
      </div>

      <!-- 空列表提示 -->
      <div v-if="items.length === 0" class="empty-tip">暂无事项，快来添加吧～</div>
    </div>

    <!-- 用户列表视图 (备用) -->
    <div v-else>
      <h3>用户列表</h3>
      <div v-for="(user, index) in users" :key="index" class="user-card">
        姓名：{{ user.name }} | 年龄：{{ user.age }}
      </div>
      <button class="toggle-btn" @click="toggleView">返回事项列表</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// 响应式数据 - 商品列表
const items = ref(['去图书馆学习', '上羽毛球课', '会议室开会']);

// 响应式数据 - 用户列表 (备用)
const users = ref([
  { name: '张三', age: 25 },
  { name: '李四', age: 30 },
]);

// 视图切换控制
const showUsers = ref(false);

// 商品名称输入绑定
const newItemName = ref('');

// 添加商品方法
const addItem = () => {
  const productName = newItemName.value.trim();
  if (productName) {
    items.value.push(productName);
    newItemName.value = ''; // 添加后清空输入框
  } else {
    alert('请输入有效的事项名称！');
  }
};

// 删除商品方法
const removeItem = (index) => {
  items.value.splice(index, 1);
};

// 新增：清空列表方法
const clearList = () => {
  // 增加确认提示，防止误操作
  if (confirm('确定要清空所有事项吗？此操作不可恢复。')) {
    items.value = [];
  }
};

// 切换视图方法
const toggleView = () => {
  showUsers.value = !showUsers.value;
};
</script>

<style scoped>
/* 注意：样式使用了 scoped 属性，确保样式只作用于当前组件 */
.list-container {
  border: 5px solid #bdddf2;
  border-radius: 8px;
  padding: 25px;
  background-color: #fff;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-top: 0;
  border-bottom: 2px solid #bdddf2;
  padding-bottom: 10px;
}

.add-item-form {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

input[type='text'] {
  flex-grow: 1;
  min-width: 200px;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  background-color: #cbebb8;
}

input[type='text']:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

button {
  padding: 10px 18px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

button:hover {
  opacity: 0.9;
}

.add-btn {
  background: #4caf50;
  color: white;
}

.remove-btn {
  background: #f44336;
  color: white;
  /* 可以给删除按钮一个固定的宽度，使其对齐 */
  width: 80px;
}

.clear-btn {
  background: #ff9800; /* 橙色，代表警告 */
  color: white;
}

.toggle-btn {
  background: #2196f3;
  color: white;
}

/* 新增：商品行容器，使用 Flex 布局 */
.item-row {
  display: flex;
  justify-content: space-between; /* 两端对齐 */
  align-items: center; /* 垂直居中 */
  padding: 12px;
  margin: 8px 0;
  background: #f8f8f8;
  border-radius: 4px;
  border-left: 3px solid #4caf50;
}

/* 商品名称样式 */
.item-name {
  color: #333;
  /* 让商品名称区域占据剩余空间，并在内容过长时显示省略号 */
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 10px; /* 与按钮保持一点距离 */
}

.user-card {
  border: 1px solid #eee;
  padding: 12px;
  margin: 8px 0;
  border-radius: 4px;
  background-color: #fafafa;
}

.empty-tip {
  text-align: center;
  padding: 25px;
  color: #666;
  background-color: #fafafa;
  border-radius: 4px;
  margin: 8px 0;
}
</style>