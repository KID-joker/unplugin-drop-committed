// Basic JavaScript file with console.log calls
function greet(name) {
  console.log(`Hello, ${name}`)
  return `Hello, ${name}`
}

function calculate(a, b) {
  console.log('Calculating:', a, b)
  const result = a + b
  console.log('Result:', result)
  return result
}

export { greet, calculate }
