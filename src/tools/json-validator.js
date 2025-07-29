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

  function getDetailedJsonError(text, error) {
    const lines = text.split('\n')
    const errorMessage = error.message
    
    // Try to extract line and column information from error message
    const lineMatch = errorMessage.match(/line (\d+)/i) || errorMessage.match(/position (\d+)/)
    const columnMatch = errorMessage.match(/column (\d+)/i)
    
    let lineNumber = null
    let columnNumber = null
    
    if (lineMatch) {
      const position = parseInt(lineMatch[1])
      if (errorMessage.includes('position')) {
        // Convert position to line/column
        let currentPos = 0
        for (let i = 0; i < lines.length; i++) {
          if (currentPos + lines[i].length >= position) {
            lineNumber = i + 1
            columnNumber = position - currentPos + 1
            break
          }
          currentPos += lines[i].length + 1 // +1 for newline
        }
      } else {
        lineNumber = position
      }
    }
    
    if (columnMatch) {
      columnNumber = parseInt(columnMatch[1])
    }

    // Common JSON error patterns and their explanations
    const errorPatterns = [
      {
        pattern: /unexpected token/i,
        explanation: "Invalid character or symbol found"
      },
      {
        pattern: /unexpected end of json input/i,
        explanation: "JSON is incomplete - missing closing brackets, quotes, or values"
      },
      {
        pattern: /expected property name or '}'/i,
        explanation: "Missing property name or invalid object structure"
      },
      {
        pattern: /trailing comma/i,
        explanation: "Remove the comma after the last item in object or array"
      },
      {
        pattern: /duplicate key/i,
        explanation: "Object contains duplicate property names"
      },
      {
        pattern: /unterminated string/i,
        explanation: "String is missing closing quote"
      },
      {
        pattern: /invalid number/i,
        explanation: "Number format is invalid"
      }
    ]

    let explanation = "Invalid JSON syntax"
    for (const {pattern, explanation: exp} of errorPatterns) {
      if (pattern.test(errorMessage)) {
        explanation = exp
        break
      }
    }

    return {
      message: errorMessage,
      explanation,
      line: lineNumber,
      column: columnNumber
    }
  }

  function validateJson(text) {
    if (!text.trim()) {
      jsonStatus.innerHTML = '<span class="status-text">Ready - Enter JSON to validate</span>'
      jsonPathHint.style.display = 'block'
      return { valid: true, formatted: '' }
    }

    // Check for common issues before parsing
    const issues = []
    
    // Check for unescaped quotes
    const unescapedQuotes = text.match(/(?<!\\)"/g)
    if (unescapedQuotes && unescapedQuotes.length % 2 !== 0) {
      issues.push("Unmatched quotes detected")
    }

    // Check for trailing commas
    if (/,\s*[}\]]/g.test(text)) {
      issues.push("Trailing commas found")
    }

    // Check for single quotes instead of double quotes
    if (/'[^']*'/g.test(text)) {
      issues.push("Single quotes detected (use double quotes)")
    }

    // Check for unquoted keys
    if (/{\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/g.test(text)) {
      issues.push("Unquoted object keys detected")
    }

    try {
      const parsed = JSON.parse(text)
      const formatted = JSON.stringify(parsed, null, 2)
      
      // Additional validation for edge cases
      const warnings = []
      
      // Check for very large numbers that might lose precision
      const largeNumberRegex = /:\s*(\d{16,})/g
      if (largeNumberRegex.test(text)) {
        warnings.push("Large numbers detected - may lose precision")
      }

      // Check for potential circular references in the original text
      const stringified = JSON.stringify(parsed)
      if (stringified.length > text.length * 2) {
        warnings.push("Complex nested structure detected")
      }

      let statusMessage = '<span class="status-text success">✓ Valid JSON'
      if (warnings.length > 0) {
        statusMessage += ` (${warnings.length} warning${warnings.length > 1 ? 's' : ''})`
      }
      statusMessage += '</span>'
      
      if (warnings.length > 0) {
        statusMessage += '<div class="json-warnings">' + warnings.map(w => `⚠ ${w}`).join('<br>') + '</div>'
      }

      jsonStatus.innerHTML = statusMessage
      jsonPathHint.style.display = 'block'
      return { valid: true, formatted, parsed, warnings }
    } catch (error) {
      const errorDetails = getDetailedJsonError(text, error)
      
      let errorHtml = `<span class="status-text error">✗ ${errorDetails.explanation}</span>`
      
      if (errorDetails.line) {
        errorHtml += `<div class="error-location">Line ${errorDetails.line}${errorDetails.column ? `, Column ${errorDetails.column}` : ''}</div>`
      }
      
      if (issues.length > 0) {
        errorHtml += '<div class="json-issues">' + issues.map(issue => `• ${issue}`).join('<br>') + '</div>'
      }
      
      errorHtml += `<div class="error-details">${errorDetails.message}</div>`
      
      jsonStatus.innerHTML = errorHtml
      jsonPathHint.style.display = 'none'
      return { valid: false, error: errorDetails, issues }
    }
  }

  function attemptRepair(text) {
    // First try the jsonrepair library - it's much more robust
    try {
      const repaired = jsonrepair(text)
      // Test if the repair worked
      JSON.parse(repaired)
      return repaired
    } catch (error) {
      console.log('jsonrepair failed, trying fallback repair:', error.message)
    }

    // Fallback to our custom repair logic
    try {
      let repaired = text

      // Step 1: Replace single quotes with double quotes (but not inside strings)
      repaired = repaired.replace(/'([^'\\]*(\\.[^'\\]*)*)'/g, '"$1"')
      
      // Step 2: Add quotes to unquoted keys
      repaired = repaired.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
      
      // Step 3: Remove trailing commas
      repaired = repaired.replace(/,(\s*[}\]])/g, '$1')
      
      // Step 4: Add missing closing braces/brackets
      const openBraces = (repaired.match(/{/g) || []).length
      const closeBraces = (repaired.match(/}/g) || []).length
      const openBrackets = (repaired.match(/\[/g) || []).length
      const closeBrackets = (repaired.match(/\]/g) || []).length
      
      // Add missing closing braces
      for (let i = 0; i < openBraces - closeBraces; i++) {
        repaired += '}'
      }
      
      // Add missing closing brackets
      for (let i = 0; i < openBrackets - closeBrackets; i++) {
        repaired += ']'
      }
      
      // Step 5: Fix common escape sequence issues
      repaired = repaired.replace(/\\'/g, "'") // Remove unnecessary escapes
      
      // Step 6: Fix missing commas between array/object elements
      repaired = repaired.replace(/}(\s*){/g, '},$1{')
      repaired = repaired.replace(/](\s*)\[/g, '],$1[')
      
      // Step 7: Fix numbers with leading zeros
      repaired = repaired.replace(/:\s*0+(\d+)/g, ': $1')
      
      // Step 8: Remove comments (// and /* */)
      repaired = repaired.replace(/\/\/.*$/gm, '')
      repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, '')
      
      // Step 9: Fix undefined/null values
      repaired = repaired.replace(/:\s*undefined/g, ': null')
      
      // Test if the repair worked
      if (/[{,]\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/g.test(text)) {
      }
      return repaired
    } catch {
      // If basic repair fails, try more aggressive fixes
      // Check for incomplete JSON structures
      const openBraces = (text.match(/{/g) || []).length
      const closeBraces = (text.match(/}/g) || []).length
      const openBrackets = (text.match(/\[/g) || []).length
      const closeBrackets = (text.match(/\]/g) || []).length
      
      if (openBraces !== closeBraces) {
        issues.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`)
      }
      if (openBrackets !== closeBrackets) {
        issues.push(`Mismatched brackets: ${openBrackets} opening, ${closeBrackets} closing`)
      }

      try {
        let aggressive = text
        
        // Remove all comments
        aggressive = aggressive.replace(/\/\/.*$/gm, '')
        aggressive = aggressive.replace(/\/\*[\s\S]*?\*\//g, '')
        
        // Fix function calls and expressions
        aggressive = aggressive.replace(/:\s*[a-zA-Z_$][a-zA-Z0-9_$]*\([^)]*\)/g, ': null')
        
        // Fix boolean values
        aggressive = aggressive.replace(/:\s*True/g, ': true')
        aggressive = aggressive.replace(/:\s*False/g, ': false')
        
        // Remove trailing semicolons
        aggressive = aggressive.replace(/;/g, '')
        
        JSON.parse(aggressive)
        return aggressive
      } catch {
        return null
      }
    }
  }

  // Enhanced input handler with debouncing
  let validationTimeout
  jsonInput.addEventListener('input', () => {
    updateLineNumbers()
    
    clearTimeout(validationTimeout)
    validationTimeout = setTimeout(() => {
      const result = validateJson(jsonInput.value)
      
      if (!result.valid && autoRepairCheckbox.checked && jsonInput.value.trim()) {
        const repaired = attemptRepair(jsonInput.value)
        if (repaired && repaired !== jsonInput.value) {
          const cursorPos = jsonInput.selectionStart
          jsonInput.value = JSON.stringify(JSON.parse(repaired), null, 2)
          updateLineNumbers()
          validateJson(jsonInput.value)
          
          // Try to restore cursor position
          setTimeout(() => {
            jsonInput.setSelectionRange(cursorPos, cursorPos)
          }, 0)
        }
      }
    }, 300)
  })

  // Button handlers
  document.getElementById('json-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(jsonInput.value)
      showToast('Copied to clipboard!')
    } catch (err) {
      console.error('Failed to copy:', err)
    }
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
      showToast('JSON formatted!')
    } else {
      showToast('Cannot format invalid JSON', 'error')
    }
  })

  document.getElementById('json-repair').addEventListener('click', () => {
    const repaired = attemptRepair(jsonInput.value)
    if (repaired) {
      jsonInput.value = JSON.stringify(JSON.parse(repaired), null, 2)
      updateLineNumbers()
      validateJson(jsonInput.value)
      showToast('JSON repaired!')
    } else {
      showToast('Unable to repair JSON', 'error')
    }
  })

  document.getElementById('json-clear').addEventListener('click', () => {
    jsonInput.value = ''
    updateLineNumbers()
    validateJson('')
  })

  // Toast notification function
  function showToast(message, type = 'success') {
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message
    document.body.appendChild(toast)
    
    setTimeout(() => toast.classList.add('show'), 100)
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => document.body.removeChild(toast), 300)
    }, 2000)
  }

  // Initialize
  updateLineNumbers()
  validateJson('')
}