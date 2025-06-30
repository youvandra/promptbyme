import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/home/HomePage'
import { SharedPromptPage } from './pages/shared-prompt/SharedPromptPage'
import { GalleryPage } from './pages/gallery/GalleryPage'
import { ProfilePage } from './pages/profile/ProfilePage'
import { PublicProfilePage } from './pages/public-profile/PublicProfilePage'
import { PlaygroundPage } from './pages/playground/PlaygroundPage'
import { ProjectSpacePage } from './pages/project-space/ProjectSpacePage'
import { DashboardPage } from './pages/project-space/DashboardPage'
import { PromptFlowPage } from './pages/prompt-flow/PromptFlowPage'
import { ApiPage } from './pages/profile/ApiPage'
import { CheckoutSuccessPage } from './pages/profile/CheckoutSuccessPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/project-space" element={<DashboardPage />} />
        <Route path="/prompt-flow" element={<PromptFlowPage />} />
        <Route path="/project/:projectId" element={<ProjectSpacePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/api" element={<ApiPage />} />
       <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
        <Route path="/:username" element={<PublicProfilePage />} />
        <Route path="/:username/:id" element={<SharedPromptPage />} />
      </Routes>
    </Router>
  )
}

export default App