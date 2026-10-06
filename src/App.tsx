import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import About from './pages/About'
import Contact from './pages/Contact'
import { Imprint, Privacy } from './pages/Legal'
import { ForgotPassword, ResetPassword } from './pages/PasswordReset'
import Account from './pages/Account'
import Admin from './pages/Admin'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/passwort-vergessen" element={<ForgotPassword />} />
      <Route path="/passwort-reset" element={<ResetPassword />} />
      <Route path="/konto" element={<Account />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/ueber-uns" element={<About />} />
      <Route path="/kontakt" element={<Contact />} />
      <Route path="/impressum" element={<Imprint />} />
      <Route path="/datenschutz" element={<Privacy />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
