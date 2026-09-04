import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      // Regra nova (eslint-plugin-react-hooks v7) que assinala o padrão
      // "useEffect(() => { carregarDados() }, [])" usado para buscar
      // dados ao montar um componente, um padrão comum e válido neste
      // projeto (não há biblioteca de fetching tipo React Query/SWR).
      // Rebaixada para aviso em vez de erro: continua visível no lint,
      // mas não bloqueia CI nem obriga a um refactor de ~18 páginas
      // para resolver "à letra". Ver RECUPERACAO_BD.md.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
