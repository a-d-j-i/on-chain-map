// eslint.config.js
import {defineConfig, globalIgnores} from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettierConfig,
  eslintPluginPrettierRecommended,
  globalIgnores(['artifacts/*']),
  // extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  // parser: '@typescript-eslint/parser',
  // plugins: ['@typescript-eslint'],
  // root: true,
]);
