<div align="center">

<h1>yunji-tagger</h1>

A simple Vite + React/Vue Plugin 

</div>

## Installation

```bash
npm install --save-dev yunji-tagger
```

```bash
yarn add  -dev yunji-tagger
```


## Usage

### Vite + React

```ts
import { defineConfig } from 'vite'
import { ReactInjectorVitePlugin } from 'yunji-tagger'

// https://vitejs.dev/config/
export default defineConfig({
  ...
  plugins: [ReactInjectorVitePlugin()],
  ...
})
```

### Vite + Vue

```ts
import { defineConfig } from 'vite'
import { VueInjectorVitePlugin } from 'yunji-tagger'

// https://vitejs.dev/config/
export default defineConfig({
  ...
  plugins: [VueInjectorVitePlugin(),],
  ...
})
```


## Configure

Read the [Contributing guide](./CONTRIBUTING.md)

