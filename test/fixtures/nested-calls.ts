// Nested method calls with dot notation
const logger = {
  info: {
    log(msg: string) {
      console.log('[INFO]', msg)
    },
  },
}

class MyClass {
  name: string

  constructor() {
    this.name = 'MyClass'
  }

  method() {
    console.log('Method called')
    logger.info.log('Inside method')
  }
}

export { logger, MyClass }
