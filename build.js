#!/usr/bin/env node
const { promises: fs } = require('fs')
const path = require('path')

async function main () {
  const root = __dirname
  const readPath = path.join(root, 'src', 'index.js')
  const src = await fs.readFile(readPath, 'utf8')

  const cjs = '\nmodule.exports = dom\n'

  fs.writeFile(path.join(root, 'dist', 'index.cjs'), src + cjs, { flag: 'a' })

  const js = '\nexport { dom }\nexport default dom\n'

  fs.writeFile(path.join(root, 'dist', 'index.mjs'), src + js, { flag: 'a' })
}

main()
