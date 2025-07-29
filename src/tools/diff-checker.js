import * as Diff from 'diff'

export function initDiffChecker() {
  const diffInput1 = document.getElementById('diff-input-1')
  const diffInput2 = document.getElementById('diff-input-2')
  const diffOutput = document.getElementById('diff-output')
  const lineNumbers1 = document.getElementById('diff-line-numbers-1')
  const lineNumbers2 = document.getElementById('diff-line-numbers-2')
  const splitViewCheckbox = document.getElementById('diff-split-view')

  const sampleText1 = `// Enter old
code above`

  const sampleText2 = `// Enter new
code above`

  function updateLineNumbers(textarea, lineNumbersEl) {
    const lines = textarea.value.split('\n').length
    lineNumbersEl.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('\n')
  }

  function generateDiff() {
    const text1 = diffInput1.value
    const text2 = diffInput2.value

    if (!text1 && !text2) {
      diffOutput.innerHTML = '<div class="diff-placeholder">Enter text in both panels above to see the differences</div>'
      return
    }

    const diff = Diff.diffLines(text1, text2)
    let diffHtml = ''
    let lineNum1 = 1
    let lineNum2 = 1

    if (splitViewCheckbox.checked) {
      // Split view
      diff.forEach(part => {
        const lines = part.value.split('\n')
        if (lines[lines.length - 1] === '') lines.pop() // Remove empty last line

        lines.forEach(line => {
          if (part.removed) {
            diffHtml += `<div class="diff-line removed">
              <span class="line-number">${lineNum1}</span>
              <span class="diff-marker">-</span>
              <span class="line-content">${escapeHtml(line)}</span>
            </div>`
            lineNum1++
          } else if (part.added) {
            diffHtml += `<div class="diff-line added">
              <span class="line-number">${lineNum2}</span>
              <span class="diff-marker">+</span>
              <span class="line-content">${escapeHtml(line)}</span>
            </div>`
            lineNum2++
          } else {
            diffHtml += `<div class="diff-line unchanged">
              <span class="line-number">${lineNum1}</span>
              <span class="diff-marker"> </span>
              <span class="line-content">${escapeHtml(line)}</span>
            </div>`
            lineNum1++
            lineNum2++
          }
        })
      })
    } else {
      // Unified view
      diff.forEach(part => {
        const lines = part.value.split('\n')
        if (lines[lines.length - 1] === '') lines.pop()

        lines.forEach(line => {
          if (part.removed) {
            diffHtml += `<div class="diff-line removed">
              <span class="line-number">${lineNum1}</span>
              <span class="diff-marker">-</span>
              <span class="line-content">${escapeHtml(line)}</span>
            </div>`
            lineNum1++
          } else if (part.added) {
            diffHtml += `<div class="diff-line added">
              <span class="line-number">${lineNum2}</span>
              <span class="diff-marker">+</span>
              <span class="line-content">${escapeHtml(line)}</span>
            </div>`
            lineNum2++
          } else {
            diffHtml += `<div class="diff-line unchanged">
              <span class="line-number">${lineNum1}</span>
              <span class="diff-marker"> </span>
              <span class="line-content">${escapeHtml(line)}</span>
            </div>`
            lineNum1++
            lineNum2++
          }
        })
      })
    }

    diffOutput.innerHTML = `<div class="diff-content">${diffHtml}</div>`
  }

  function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Event listeners
  diffInput1.addEventListener('input', () => {
    updateLineNumbers(diffInput1, lineNumbers1)
    generateDiff()
  })

  diffInput2.addEventListener('input', () => {
    updateLineNumbers(diffInput2, lineNumbers2)
    generateDiff()
  })

  splitViewCheckbox.addEventListener('change', generateDiff)

  // Button handlers
  document.getElementById('diff-sample-1').addEventListener('click', () => {
    diffInput1.value = sampleText1
    updateLineNumbers(diffInput1, lineNumbers1)
    generateDiff()
  })

  document.getElementById('diff-sample-2').addEventListener('click', () => {
    diffInput2.value = sampleText2
    updateLineNumbers(diffInput2, lineNumbers2)
    generateDiff()
  })

  document.getElementById('diff-clear-1').addEventListener('click', () => {
    diffInput1.value = ''
    updateLineNumbers(diffInput1, lineNumbers1)
    generateDiff()
  })

  document.getElementById('diff-clear-2').addEventListener('click', () => {
    diffInput2.value = ''
    updateLineNumbers(diffInput2, lineNumbers2)
    generateDiff()
  })

  // Initialize
  updateLineNumbers(diffInput1, lineNumbers1)
  updateLineNumbers(diffInput2, lineNumbers2)
}