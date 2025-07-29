export function initJsonValidator() {
  const jsonInput = document.getElementById('json-input')
  const jsonStatus = document.getElementById('json-status')
  const jsonPathHint = document.getElementById('json-path-hint')
  const lineNumbers = document.getElementById('json-line-numbers')
  const autoRepairCheckbox = document.getElementById('json-auto-repair')

  const sampleJson = {
    "store": {
      "book": [
        {
          "category": "reference",
          "author": "Nigel Rees",
          "title": "Sayings of the Century",
          "price": 8.95
        },
        {
          "category": "fiction",
          "author": "Evelyn Waugh",
          "title": "Sword of Honour",
          "price": 12.99
        }
      ],
      "bicycle": {
        "color": "red",
        "price": 19.95
      }
    }
  }

  function updateLineNumbers() {
    const lines = jsonInput.value.split('\n').length
    lineNumbers.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('\n')
  }

  function validateJson(text) {
    if (!text.trim()) {
      jsonStatus.innerHTML = '<span class="status-text">Ready</span>'
      jsonPathHint.style.display = 'block'
      return { valid: true, formatted: '' }
    }

    try {
      const parsed = JSON.parse(text)
      const formatted = JSON.stringify(parsed, null, 2)
      jsonStatus.innerHTML = '<span class="status-text success">✓ Valid JSON</span>'
      jsonPathHint.style.display = 'block'
      return { valid: true, formatted, parsed }
    } catch (error) {
      jsonStatus.innerHTML = `<span class="status-text error">✗ ${error.message}</span>`
      jsonPathHint.style.display = 'none'
      return { valid: false, error: error.message }
    }
  }

  function attemptRepair(text) {
    try {
      // Common JSON repair attempts
      let repaired = text
        .replace(/'/g, '"')  // Replace single quotes with double quotes
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Add quotes to unquoted keys
        .replace(/,(\s*[}\]])/g, '$1')  // Remove trailing commas
        .replace(/\n/g, ' ')  // Remove newlines
        .trim()

      JSON.parse(repaired)
      return repaired
    } catch {
      return null
    }
  }

  jsonInput.addEventListener('input', () => {
    updateLineNumbers()
    const result = validateJson(jsonInput.value)
    
    if (!result.valid && autoRepairCheckbox.checked) {
      const repaired = attemptRepair(jsonInput.value)
      if (repaired) {
        jsonInput.value = JSON.stringify(JSON.parse(repaired), null, 2)
        updateLineNumbers()
        validateJson(jsonInput.value)
      }
    }
  })

  // Button handlers
  document.getElementById('json-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(jsonInput.value)
  })

  document.getElementById('json-sample').addEventListener('click', () => {
    jsonInput.value = JSON.stringify(sampleJson, null, 2)
    updateLineNumbers()
    validateJson(jsonInput.value)
  })

  document.getElementById('json-format').addEventListener('click', () => {
    const result = validateJson(jsonInput.value)
    if (result.valid && result.formatted) {
      jsonInput.value = result.formatted
      updateLineNumbers()
    }
  })

  document.getElementById('json-repair').addEventListener('click', () => {
    const repaired = attemptRepair(jsonInput.value)
    if (repaired) {
      jsonInput.value = JSON.stringify(JSON.parse(repaired), null, 2)
      updateLineNumbers()
      validateJson(jsonInput.value)
    }
  })

  document.getElementById('json-clear').addEventListener('click', () => {
    jsonInput.value = ''
    updateLineNumbers()
    validateJson('')
  })

  // Initialize
  updateLineNumbers()
}