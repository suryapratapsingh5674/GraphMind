import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ChatPage from './pages/ChatPage.jsx'
import MemoryGraphPage from './pages/MemoryGraphPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ChatPage />} />
        <Route path="/graph" element={<MemoryGraphPage />} />
      </Routes>
    </BrowserRouter>
  )
}
