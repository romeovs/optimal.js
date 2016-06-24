
# Optimal.js

A simple options parser for node that can get options from different sources.

## Installation
```
npm install optimal.js --save
```

## Example

```js
import optimal from 'optimal'

const opts = optimal('prefix', { config: 'config-file' })

const v = opts.option('foo')
  .type('integer')
  .description('foo is an integer')
  .required()
  .get()
```

If run, this script would try to get the `foo` option from these locations:

- the `--foo` parameter
- a key named foo in the config file pointed to by the `config-file` option
- the `PREFIX_FOO` envirnment variable

The value will be parsed and ready to use!


## Docs

To do!
