<script>
  import { onMount } from 'svelte'

  let count = 0
  console.log('svelte script')

  onMount(() => {
    console.log('mounted')
  })
</script>

<main>
  <h1>Hello {count}</h1>
  <button on:click={() => count++}>Increment</button>
</main>
