const plugin = require('../src/babel')
const { babelify } = require('../src/transform')
const { transpile } = require('../src')
const makeWrapper = require('../src/wrapper')

test('pure property', () => {
  let src = `
    @contract class A {
      @pure state = 1
      @pure method = () => 1
    }
  `
  src = babelify(src, [plugin])

  // wrapper is easy logic but long
  // only run once for coverage
  makeWrapper(src).trim()

  expect(src).toBe(`class A {
  state = 1;
  method = () => 1;
}

const __contract = new A();

const __metadata = {
  state: {
    type: "ClassProperty",
    decorators: ["pure"],
    fieldType: "any"
  },
  method: {
    type: "ClassProperty",
    decorators: ["pure"],
    returnType: "any",
    params: []
  }
};`)
})

test('cannot duplicate getter and setter', () => {
  let src = `
    @contract class A {
      @state state = 1

      get state() {
        return undefined
      }

      set state(value) {
        this.setState("state", undefined);
      }
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('not use function property with state', () => {
  let src = `
    @contract class A {
      @state func = () => {}
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('not use private function with state', () => {
  let src = `
    @contract class A {
      @state #func = () => {}
    }
  `
  expect(() => {
    src = babelify(src, [plugin])
  }).toThrow(SyntaxError)
})

test('try transpile', async () => {
  let src = `
    @contract class A {
      @state state = 1
    }
  `
  let cannotMinSrc = `
    @contract class A {
      @pure state = () => 1
    }
  `

  await transpile(src, { prettier: true })
  await transpile(src, { minify: true })
  await expect(transpile(cannotMinSrc, { minify: true })).rejects.toThrow(Error)
})

test('getState default', async () => {
  let src = `
    @contract class A {
      @state numberState = 1
      @state arrayState = [1, 2, 3]
      @state sumState = 1 + 2
      @state objState = { state: 1 }
    }
  `
  src = babelify(src, [plugin])
  expect(src).toBe(`class A {
  get numberState() {
    const state = this.getState("numberState", 1);

    if (typeof state !== 'object') {
      return state;
    }

    return new Proxy(state, {
      set: (target, prop, value) => {
        target[prop] = value;
        this.setState("numberState", target);
        return true;
      }
    });
  }

  set numberState(value) {
    this.setState("numberState", value);
  }

  get arrayState() {
    const state = this.getState("arrayState", [1, 2, 3]);

    if (typeof state !== 'object') {
      return state;
    }

    return new Proxy(state, {
      set: (target, prop, value) => {
        target[prop] = value;
        this.setState("arrayState", target);
        return true;
      }
    });
  }

  set arrayState(value) {
    this.setState("arrayState", value);
  }

  get sumState() {
    const state = this.getState("sumState", 1 + 2);

    if (typeof state !== 'object') {
      return state;
    }

    return new Proxy(state, {
      set: (target, prop, value) => {
        target[prop] = value;
        this.setState("sumState", target);
        return true;
      }
    });
  }

  set sumState(value) {
    this.setState("sumState", value);
  }

  get objState() {
    const state = this.getState("objState", {
      state: 1
    });

    if (typeof state !== 'object') {
      return state;
    }

    return new Proxy(state, {
      set: (target, prop, value) => {
        target[prop] = value;
        this.setState("objState", target);
        return true;
      }
    });
  }

  set objState(value) {
    this.setState("objState", value);
  }

}

const __contract = new A();

const __metadata = {
  numberState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: "any"
  },
  arrayState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: "any"
  },
  sumState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: "any"
  },
  objState: {
    type: "ClassProperty",
    decorators: ["state", "internal"],
    fieldType: "any"
  }
};`)
})
