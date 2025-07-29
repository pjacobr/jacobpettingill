import * as Diff from 'diff'
import { createTwoFilesPatch, structuredPatch } from 'diff'

export function initDiffChecker() {
  const diffInput1 = document.getElementById('diff-input-1')
  const diffInput2 = document.getElementById('diff-input-2')
  const diffOutput = document.getElementById('diff-output')
  const lineNumbers1 = document.getElementById('diff-line-numbers-1')
  const lineNumbers2 = document.getElementById('diff-line-numbers-2')
  const splitViewCheckbox = document.getElementById('diff-split-view')
  const diffStats = document.getElementById('diff-stats')

  const sampleText1 = `function calculateTotal(items) {
  let total = 0;
  for (let item of items) {
    total += item.price * item.quantity;
  }
  return total;
}

const cart = [
  { name: "Apple", price: 1.50, quantity: 3 },
  { name: "Banana", price: 0.75, quantity: 5 }
];

console.log("Total:", calculateTotal(cart));`

  const sampleText2 = `function calculateTotal(items, taxRate = 0.08) {
  let subtotal = 0;
  for (const item of items) {
    subtotal += item.price * item.quantity;
  }
  const tax = subtotal * taxRate;
  return subtotal + tax;
}

const cart = [
  { name: "Apple", price: 1.50, quantity: 3 },
  { name: "Banana", price: 0.75, quantity: 5 },
  { name: "Orange", price: 2.00, quantity: 2 }
];

const total = calculateTotal(cart);
console.log("Subtotal + Tax:", total.toFixed(2));`

  function updateLineNumbers(textarea, lineNumbersEl) {
    const lines = textarea.value.split('\n').length
    lineNumbersEl.innerHTML = Array.from({length: lines}, (_, i) => i + 1).join('\n')
  }


  function calculateStats(diff) {
    let additions = 0
    let deletions = 0
    let modifications = 0
    let unchanged = 0

    diff.forEach(part => {
      const lineCount = (part.value.match(/\n/g) || []).length || (part.value ? 1 : 0)
      
      if (part.added) {
        additions += lineCount
      } else if (part.removed) {
        deletions += lineCount
      } else {
        unchanged += lineCount
      }
    })

    // Count modifications (lines that are both added and removed)
    let i = 0
    while (i < diff.length - 1) {
      if (diff[i].removed && diff[i + 1].added) {
        const removedLines = (diff[i].value.match(/\n/g) || []).length || 1
        const addedLines = (diff[i + 1].value.match(/\n/g) || []).length || 1
        const modCount = Math.min(removedLines, addedLines)
        
        modifications += modCount
        additions -= modCount
        deletions -= modCount
        i += 2
      } else {
        i++
      }
    }

    return { additions, deletions, modifications, unchanged }
  }

  function updateStats(stats) {
    const total = stats.additions + stats.deletions + stats.modifications + stats.unchanged
    diffStats.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Total Lines:</span>
        <span class="stat-value">${total}</span>
      </div>
      <div class="stat-item added">
        <span class="stat-label">Added:</span>
        <span class="stat-value">+${stats.additions}</span>
      </div>
      <div class="stat-item removed">
        <span class="stat-label">Deleted:</span>
        <span class="stat-value">-${stats.deletions}</span>
      </div>
      <div class="stat-item modified">
        <span class="stat-label">Modified:</span>
        <span class="stat-value">~${stats.modifications}</span>
      </div>
      <div class="stat-item unchanged">
        <span class="stat-label">Unchanged:</span>
        <span class="stat-value">${stats.unchanged}</span>
      </div>
    `
  }

  function generateDiff() {
    const text1 = diffInput1.value
    const text2 = diffInput2.value

    if (!text1 && !text2) {
      diffOutput.innerHTML = '<div class="diff-placeholder">Enter text in both panels above to see the differences</div>'
      diffStats.innerHTML = ''
      return
    }

    const diff = Diff.diffLines(text1, text2)

    const stats = calculateStats(diff)
    updateStats(stats)

    let diffHtml = ''
    let lineNum1 = 1
    let lineNum2 = 1

    if (splitViewCheckbox.checked) {
      diffHtml = generateSplitView(diff, lineNum1, lineNum2)
    } else {
      diffHtml = generateUnifiedView(diff, lineNum1, lineNum2)
    }

    diffOutput.innerHTML = `<div class="diff-content">${diffHtml}</div>`
  }


  function generateSplitView(diff, startLine1, startLine2) {
    let html = '<div class="diff-split-container">'
    html += '<div class="diff-split-left"><div class="diff-split-header">Original</div>'
    html += '<div class="diff-split-content">'
    
    let lineNum1 = startLine1
    let lineNum2 = startLine2
    
    diff.forEach(part => {
      const lines = part.value.split('\n')
      if (lines[lines.length - 1] === '') lines.pop()

      lines.forEach(line => {
        if (part.removed) {
          html += `<div class="diff-line removed">
            <span class="line-number">${lineNum1}</span>
            <span class="diff-marker">-</span>
            <span class="line-content">${escapeHtml(line)}</span>
          </div>`
          lineNum1++
        } else if (!part.added) {
          html += `<div class="diff-line unchanged">
            <span class="line-number">${lineNum1}</span>
            <span class="diff-marker"> </span>
            <span class="line-content">${escapeHtml(line)}</span>
          </div>`
          lineNum1++
        }
      })
    })
    
    html += '</div></div><div class="diff-split-right"><div class="diff-split-header">Changed</div>'
    html += '<div class="diff-split-content">'
    
    diff.forEach(part => {
      const lines = part.value.split('\n')
      if (lines[lines.length - 1] === '') lines.pop()

      lines.forEach(line => {
        if (part.added) {
          html += `<div class="diff-line added">
            <span class="line-number">${lineNum2}</span>
            <span class="diff-marker">+</span>
            <span class="line-content">${escapeHtml(line)}</span>
          </div>`
          lineNum2++
        } else if (!part.removed) {
          html += `<div class="diff-line unchanged">
            <span class="line-number">${lineNum2}</span>
            <span class="diff-marker"> </span>
            <span class="line-content">${escapeHtml(line)}</span>
          </div>`
          lineNum2++
        }
      })
    })
    
    html += '</div></div></div>'
    return html
  }

  function generateUnifiedView(diff, startLine1, startLine2) {
    let html = ''
    let lineNum1 = startLine1
    let lineNum2 = startLine2

    diff.forEach(part => {
      const lines = part.value.split('\n')
      if (lines[lines.length - 1] === '') lines.pop()

      lines.forEach(line => {
        if (part.removed) {
          html += `<div class="diff-line removed">
            <span class="line-number">${lineNum1}</span>
            <span class="diff-marker">-</span>
            <span class="line-content">${escapeHtml(line)}</span>
          </div>`
          lineNum1++
        } else if (part.added) {
          html += `<div class="diff-line added">
            <span class="line-number">${lineNum2}</span>
            <span class="diff-marker">+</span>
            <span class="line-content">${escapeHtml(line)}</span>
          </div>`
          lineNum2++
        } else {
          html += `<div class="diff-line unchanged">
            <span class="line-number">${lineNum1}</span>
            <span class="diff-marker"> </span>
            <span class="line-content">${escapeHtml(line)}</span>
          </div>`
          lineNum1++
          lineNum2++
        }
      })
    })

    return html
  }


  function escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  function exportDiff() {
    const text1 = diffInput1.value
    const text2 = diffInput2.value
    const diff = Diff.createPatch('file', text1, text2, 'Original', 'Changed')
    
    const blob = new Blob([diff], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diff.patch'
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyDiff() {
    const diffContent = diffOutput.textContent || diffOutput.innerText
    navigator.clipboard.writeText(diffContent).then(() => {
      showToast('Diff copied to clipboard!')
    }).catch(err => {
      console.error('Failed to copy:', err)
      showToast('Failed to copy diff', 'error')
    })
  }

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

  document.getElementById('diff-export').addEventListener('click', exportDiff)
  document.getElementById('diff-copy').addEventListener('click', copyDiff)

  // Initialize
  updateLineNumbers(diffInput1, lineNumbers1)
  updateLineNumbers(diffInput2, lineNumbers2)
}