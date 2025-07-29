import * as yaml from 'js-yaml'

export function initJsonYamlConverter() {
  const jsonInput = document.getElementById('yaml-json-input')
  const yamlOutput = document.getElementById('yaml-output')
  const jsonLineNumbers = document.getElementById('yaml-json-line-numbers')
  const yamlLineNumbers = document.getElementById('yaml-output-line-numbers')

  const sampleJson = {
    "name": "John Doe",
    "age": 30,
    "city": "New York",
    "hobbies": ["reading", "swimming", "coding"],
    "address": {
      "street": "123 Main St",
      "zipcode": "10001"
    }
  }

  function updateLineNumbers(textarea, lineNumbersEl) {
    const lines = textarea.value.split('\n').length
    lineNumbersEl.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('\n')
  }

  function convertToYaml() {
    const jsonText = jsonInput.value.trim()
    
    if (!jsonText) {
      yamlOutput.value = ''
      updateLineNumbers(yamlOutput, yamlLineNumbers)
      return
    }

    try {
      const jsonObj = JSON.parse(jsonText)
      const yamlText = yaml.dump(jsonObj, {
        indent: 2,
        lineWidth: -1,
        noRefs: true
      })
      yamlOutput.value = yamlText
      yamlOutput.style.color = ''
      updateLineNumbers(yamlOutput, yamlLineNumbers)
    } catch (error) {
      yamlOutput.value = 'Invalid JSON!'
      yamlOutput.style.color = '#ef4444'
      updateLineNumbers(yamlOutput, yamlLineNumbers)
    }
  }

  jsonInput.addEventListener('input', () => {
    updateLineNumbers(jsonInput, jsonLineNumbers)
    convertToYaml()
  })

  // Button handlers
  document.getElementById('yaml-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(yamlOutput.value)
  })

  document.getElementById('yaml-sample').addEventListener('click', () => {
    jsonInput.value = JSON.stringify(sampleJson, null, 2)
    updateLineNumbers(jsonInput, jsonLineNumbers)
    convertToYaml()
  })

  document.getElementById('yaml-clear').addEventListener('click', () => {
    jsonInput.value = ''
    yamlOutput.value = ''
    updateLineNumbers(jsonInput, jsonLineNumbers)
    updateLineNumbers(yamlOutput, yamlLineNumbers)
  })

  // Initialize
  updateLineNumbers(jsonInput, jsonLineNumbers)
  updateLineNumbers(yamlOutput, yamlLineNumbers)
}