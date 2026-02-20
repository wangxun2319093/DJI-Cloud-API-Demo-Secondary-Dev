module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true
  },
  extends: ['standard', 'plugin:vue/vue3-essential'],
  parserOptions: {
    ecmaVersion: 12,
    parser: '@typescript-eslint/parser'
  },
  plugins: ['vue', '@typescript-eslint'],
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly'
  },
  rules: {
    'comma-dangle': 'off',
    'import/no-absolute-path': 'off',
    'no-unused-vars': 'off',
    camelcase: 'off',
    'no-redeclare': 'off',
    'vue/no-unused-components': 'off'
  }
}
