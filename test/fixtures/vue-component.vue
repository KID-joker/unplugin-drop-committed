<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="handleClick">Click me</button>
  </div>
</template>

<script>
export default {
  data() {
    return {
      title: 'Vue Component'
    }
  },
  methods: {
    handleClick() {
      console.log('Button clicked')
      alert('Hello from Vue!')
    }
  },
  mounted() {
    console.log('Component mounted')
  }
}
</script>

<style scoped>
h1 {
  color: blue;
}
</style>
