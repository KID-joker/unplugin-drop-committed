<template>
  <div>{{ msg }}</div>
</template>

<script>
import { ref } from 'vue'

export default {
  setup() {
    console.log('setup called')
    const msg = ref('hello')
    return { msg }
  }
}
</script>

<script setup>
import { computed } from 'vue'

console.log('script setup')
const count = computed(() => 1)
</script>
