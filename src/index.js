import bind from 'autobind-decorator'
import fs from 'fs'
import yargs from 'yargs'

const envname = function (name, prefix = false) {
  const prefixed = prefix ? prefix.concat('-').concat(name) : name
  return prefixed.replace(/-/g, '_').toUpperCase()
}

const sources = {
  environment: 1,
  args: 2,
  file: 3,
  default: 4,
}

const truthy = [ 'true', '1', 'yes' ]

@bind
class Options {
  constructor (prefix = false, opts = {}) {
    this._prefix = prefix
    this._registry = {}

    const {
      file = true,
      help = true,
    } = opts

    if (file) {
      const fileoptname = typeof file === 'string' ? file : 'config-file'
      const file = this.option(fileoptname)
        .description('the location of the config file')
        .type('string')
        .get()

      if (!fs.existsSync(file)) {
        throw new Error(`config file \`${file}\` does not exist`)
      }

    }

    if (help) {
      const helpoptname = typeof help === 'string' ? help : 'help'
      this._help = this.option(helpoptname)
        .description('show the help message')
        .type('boolean')
        .get()
      if (this._help) {
        setImmediate(() => this.help())
      }
    }
  }

  option (name) {
    if (name in this._registry) {
      throw new Error(`duplicate definition for option ${name}`)
    }

    const opt = new Option(name, this._prefix)
    this._registry[name] = opt
    return opt
  }

  help () {
    const names = Object.keys(this._registry)
    names.forEach(name => console.log(this._registry[name].toString(), '-', this._registry[name]._description))
  }
}

@bind
class Option {
  constructor (name, prefix) {
    this._prefix = prefix
    this._name = name
    this._type = 'string'
    this._required = false
    this._filename = false
    this._after = v => v
    this._description = ''

    this._hasDefault = false
    this._defaultValue = null
    this._defaultWarning = false
  }

  toString () {
    const typename = this._type.name ? this._type.name.toLowerCase() : this._type
    const bang = this._required ? '!' : ''
    return `${this._name} (${typename}${bang})`
  }

  description (d) {
    this._description = d
    return this
  }

  required () {
    this._required = true
    return this
  }

  type (t) {
    this._type = t
    return this
  }

  default (v, warning = '') {
    this._hasDefault = true
    this._default = v
    this._defaultWarning = warning
    return this
  }

  _getDefault () {
    if (typeof this._defaultWarning === 'function') {
      this._defaultWarning(this._default)
    }
    if (typeof this._defaultWarning === 'string') {
      console.warn(this._defaultWarning)
    }
    if (this._defaultWarning === true) {
      console.warn(`WARNING: using default value for ${this._name}`)
    }
    return this._default
  }

  _get () {
    // check for arg
    if (this._name in yargs.argv) {
      this._source = sources.args
      return yargs.argv[this._name]
    }

    // check for environment variable
    const e = envname(this._name, this._prefix)
    if (e in process.env) {
      this._source = sources.environment
      return process.env[e]
    }

    // use default
    if (this._hasDefault) {
      this._source = sources.default
      return this._getDefault()
    }

    this._undef = true

    if (this._required) {
      throw new Error(`no value for ${this._name} given, but it is requried`)
    }
  }

  _parse (val) {
    // if type is not string, assume it is parsed already
    // todo check some type errors here
    if (typeof val !== 'string') {
      return val
    }

    switch (this._type) {
      case 'int':
        return parseInt(val)
      case 'number':
      case Number:
        return parseFloat(val)
      case 'file':
        if (fs.existsSync(val)) {
          return fs.readFileSync(val, 'utf8')
        } else {
          throw new Error(`file \`${val}\` does not exist (option: ${this._name})`)
        }
      case 'bool':
      case 'boolean':
      case Boolean:
        return truthy.indexOf(val) !== -1
      case 'string':
      case String:
      case false:
      default:
        return val
    }
  }

  get () {
    const str = this._get()
    const val = this._parse(str)
    return val
  }
}

export default function (...args) {
  return new Options(...args)
}
