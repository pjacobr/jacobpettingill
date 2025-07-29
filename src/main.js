import './style.css'
import { initNavigation } from './navigation.js'
import { initJsonValidator } from './tools/json-validator.js'
import { initJsonYamlConverter } from './tools/json-yaml-converter.js'
import { initSqlFormatter } from './tools/sql-formatter.js'
import { initDiffChecker } from './tools/diff-checker.js'

// Initialize navigation
initNavigation()

// Initialize all tools
initJsonValidator()
initJsonYamlConverter()
initSqlFormatter()
initDiffChecker()

// Set default tool
document.addEventListener('DOMContentLoaded', () => {
  // Show welcome screen by default
  const welcomeScreen = document.getElementById('welcome-screen')
  if (welcomeScreen) {
    welcomeScreen.classList.add('active')
  }
})