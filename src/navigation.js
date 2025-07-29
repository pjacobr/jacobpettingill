export function initNavigation() {
  const navLinks = document.querySelectorAll('[data-tool]')
  const toolPanels = document.querySelectorAll('.tool-panel')
  const welcomeScreen = document.getElementById('welcome-screen')
  const currentToolTitle = document.getElementById('current-tool-title')

  function showTool(toolId) {
    // Hide all panels and welcome screen
    toolPanels.forEach(panel => panel.classList.remove('active'))
    welcomeScreen.classList.remove('active')
    
    // Show selected tool
    const selectedTool = document.getElementById(`${toolId}-tool`)
    if (selectedTool) {
      selectedTool.classList.add('active')
    }

    // Update active nav item
    navLinks.forEach(link => link.classList.remove('active'))
    const activeLink = document.querySelector(`[data-tool="${toolId}"]`)
    if (activeLink) {
      activeLink.classList.add('active')
    }

    // Update title
    const toolTitles = {
      'json-validator': 'JSON Validator & Formatter',
      'json-yaml': 'JSON to YAML Converter',
      'sql-formatter': 'SQL Formatter',
      'diff-checker': 'Diff Checker'
    }
    
    currentToolTitle.textContent = toolTitles[toolId] || 'Developer Toolkit'
  }

  // Handle navigation clicks
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const toolId = link.getAttribute('data-tool')
      showTool(toolId)
    })
  })

  // Handle tool card clicks
  const toolCards = document.querySelectorAll('.tool-card')
  toolCards.forEach(card => {
    card.addEventListener('click', () => {
      const toolId = card.getAttribute('data-tool')
      showTool(toolId)
    })
  })

  // Handle share button
  const shareBtn = document.querySelector('.share-btn')
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Developer Toolkit',
            text: 'Check out this developer toolkit with JSON, YAML, SQL, and diff tools!',
            url: window.location.href
          })
        } catch (error) {
          // Fall back to copying URL if share fails
          try {
            await navigator.clipboard.writeText(window.location.href)
            alert('URL copied to clipboard!')
          } catch (clipboardError) {
            console.error('Failed to copy to clipboard:', clipboardError)
          }
        }
      } else {
        // Fallback to copying URL
        try {
          await navigator.clipboard.writeText(window.location.href)
          alert('URL copied to clipboard!')
        } catch (error) {
          console.error('Failed to copy to clipboard:', error)
        }
      }
    })
  }
}