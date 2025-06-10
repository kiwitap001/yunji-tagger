# Contributing to yunji-tagger

## Table of Contents

- [Contributing to yunji-tagger](#contributing-to-yunji-tagger)
  - [Table of Contents](#table-of-contents)
  - [Documentation](#documentation)
    - [Installation](#installation)
    - [Usage](#usage)
      - [Vite + React](#vite--react)
      - [Vite + Vue](#vite--vue)
      - [Options](#options)



## Documentation

### Installation

```bash
npm install --save-dev yunji-tagger
```

```bash
yarn add  -dev yunji-tagger
```

### Usage

#### Vite + React

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

#### Vite + Vue

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

####  Options

`include` (string | regexp | Array[...string|regexp], default `[/\.vue$/, /\.(jsx|tsx)$/]`) - name of the file with diagram to generate

`exclude` (tring | regexp | Array[...string|regexp], default `[/node_modules/]`) - name of the file with diagram to generate

`attributes` (object, default `{uniqueId:'data-plugin-component-unique-id',filePath:'data-plugin-component-file-path',fileName:'data-plugin-component-file-name',lineNumber:'data-plugin-line-number',columnNumber:'data-plugin-column-number',tagName:'data-plugin-tag-name',tagContent:'data-plugin-tag-content',contextInfo:'data-plugin-component-context',}`) - name of the file with diagram to generate

`includeTags` (array, default `[]`) - HTML tags that need to be included

`excludeTags` (array, default `['script','style','template','link','meta','html','head','body','title','base','noscript','noframes','iframe','frame','frameset','object','embed','applet','Fragment','svg']`) - HTML tags that need to be filtered
