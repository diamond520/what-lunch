import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'
import betterTailwindcss from 'eslint-plugin-better-tailwindcss'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    ...betterTailwindcss.configs['recommended-warn'],
    settings: {
      'better-tailwindcss': {
        entryPoint: 'src/app/globals.css',
      },
    },
    rules: {
      ...betterTailwindcss.configs['recommended-warn'].rules,
      'better-tailwindcss/enforce-consistent-line-wrapping': 'off',
      'better-tailwindcss/enforce-consistent-class-order': 'off',
    },
  },
  prettier,
  {
    plugins: { prettier: prettierPlugin },
    rules: { 'prettier/prettier': 'warn' },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
