import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { SharedPromptPage } from './pages/SharedPromptPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/p/:id" element={<SharedPromptPage />} />
      </Routes>
    </Router>
  )
}

export default App