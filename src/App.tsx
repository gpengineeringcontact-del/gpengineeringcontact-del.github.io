import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import About from './pages/About'
import Contact from './pages/Contact'
import { Imprint, Privacy } from './pages/Legal'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/ueber-uns" element={<About />} />
      <Route path="/kontakt" element={<Contact />} />
      <Route path="/impressum" element={<Imprint />} />
      <Route path="/datenschutz" element={<Privacy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
