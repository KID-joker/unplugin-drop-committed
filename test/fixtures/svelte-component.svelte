<script>
  let count = 0

  function increment() {
    count++
    console.log('Count:', count)
  }

  function handleClick() {
    console.log('Button clicked')
    increment()
  }
</script>

<main>
  <h1>Svelte Component</h1>
  <button on:click={handleClick}>
    Count: {count}
  </button>
</main>

<style>
  h1 {
    color: purple;
  }
</style>
