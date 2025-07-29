import { format } from 'sql-formatter'

export function initSqlFormatter() {
  const sqlInput = document.getElementById('sql-input')
  const lineNumbers = document.getElementById('sql-line-numbers')
  const tabWidthInput = document.getElementById('sql-tab-width')
  const useTabsCheckbox = document.getElementById('sql-use-tabs')
  const languageSelect = document.getElementById('sql-language')
  const keywordCaseSelect = document.getElementById('sql-keyword-case')

  const sampleSql = `SELECT u.id, u.name, u.email, p.title, p.content, p.created_at FROM users u LEFT JOIN posts p ON u.id = p.user_id WHERE u.active = 1 AND p.published = 1 ORDER BY p.created_at DESC LIMIT 10;`

  function updateLineNumbers() {
    const lines = sqlInput.value.split('\n').length
    lineNumbers.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('\n')
  }

  function formatSql() {
    const sql = sqlInput.value.trim()
    if (!sql) return

    try {
      const options = {
        language: languageSelect.value,
        tabWidth: parseInt(tabWidthInput.value),
        useTabs: useTabsCheckbox.checked,
        keywordCase: keywordCaseSelect.value === 'preserve' ? undefined : keywordCaseSelect.value,
        indentStyle: 'standard',
        logicalOperatorNewline: 'before',
        expressionWidth: 50,
        linesBetweenQueries: 1
      }

      const formatted = format(sql, options)
      sqlInput.value = formatted
      updateLineNumbers()
    } catch (error) {
      console.error('SQL formatting error:', error)
    }
  }

  // Auto-format on input with debounce
  let formatTimeout
  sqlInput.addEventListener('input', () => {
    updateLineNumbers()
    clearTimeout(formatTimeout)
    formatTimeout = setTimeout(formatSql, 500)
  })

  // Format on settings change
  tabWidthInput.addEventListener('change', formatSql)
  useTabsCheckbox.addEventListener('change', formatSql)
  languageSelect.addEventListener('change', formatSql)
  keywordCaseSelect.addEventListener('change', formatSql)

  // Button handlers
  document.getElementById('sql-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(sqlInput.value)
  })

  document.getElementById('sql-sample').addEventListener('click', () => {
    sqlInput.value = sampleSql
    updateLineNumbers()
    formatSql()
  })

  document.getElementById('sql-clear').addEventListener('click', () => {
    sqlInput.value = ''
    updateLineNumbers()
  })

  // Initialize
  updateLineNumbers()
}