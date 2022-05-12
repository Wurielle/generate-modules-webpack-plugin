# Generate Modules Webpack Plugin
Generate CommonJS, AMD, UMD or SystemJS modules live using Webpack.

## What it do and why???
In my case I needed to share tokens between my project (TypeScript + ES modules import/export) with a configuration file (`tailwind.config.js` which is a CommonJS module).

Mixing imports and exports between ES modules and CommonJS modules or enabling `{ "type": "module" }` in your `package.json` can throw some errors that can't be resolved entirely by you sometimes.

This plugin aims to generate other types of modules for specified files that you can import differently depending on your needs.

## Install
```shell
npm config set @wurielle:registry https://npm.pkg.github.com && npm install @wurielle/generate-modules-webpack-plugin
```

## Usage
Let's say we have a `tokens.ts` file we want to share between processes with different module formats:

```typescript
// ./config/tailwindcss/tokens.ts
const tokens = {
    colors: {
        primary: {
            DEFAULT: '#b00b69'
        }
    }
} as const

export default tokens
```

Add an entry in your webpack config to watch the file and generate its modules on save/build
```javascript
// webpack.config.js
const GenerateModulesPlugin = require('@wurielle/generate-modules-webpack-plugin')
 
module.exports = {
  plugins: [
    new GenerateModulesPlugin([
        {
            pattern: './config/tailwindcss/tokens.ts',
            into: ['commonjs', 'amd', 'umd', 'systemjs'],
        },
    ]),
  ],
}
```

This will generate modules for matching files in the same folder: 
```
tokens.amd.js
tokens.common.js
tokens.systemjs.js
tokens.ts
tokens.umd.js
```

So that you can import them like:
```javascript
// CommonJS module - tailwind.config.js for instance
const tokens = require('./config/tailwindcss/tokens.common');

module.exports = {
    theme: {
        extend: {
            ...tokens
        }
    }
};
```
```typescript
// ES module - button.styled.ts for instance
import styled from 'styled-components'
import tokens from '@config/tailwindcss/tokens'

export const Button = styled.button`
  background: ${tokens.colors.primary.DEFAULT};
  color: white;

  font-size: 1em;
  margin: 1em;
  padding: 0.25em 1em;
  border: 2px solid ${tokens.colors.primary.DEFAULT};
  border-radius: 3px;
`
```

## Options

### `pattern`
Path or glob.
```javascript
{
    pattern: './src/**/*.shared.ts' // defaults to ''
}
```

### `into`
Array of module types.
```javascript
{
    pattern: ['commonjs', 'amd', 'umd', 'systemjs'] // defaults to []
}
```
