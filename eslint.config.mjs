import antfu from '@antfu/eslint-config'

export default antfu({
  ignores: [
    '**/dist',
    '**/target',
    '**/src-tauri/gen',
  ],
})
