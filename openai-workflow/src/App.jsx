import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './components/Login'
import Profile from './components/Profile'

function App() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem('ow_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  function handleLogout() {
    localStorage.removeItem('ow_user')
    setUser(null)
    navigate('/login')
  }

  return (
    <div className="app">
      <header>
        <h1>OpenAI Workflow - Demo</h1>
        <nav>
          <Link to="/">Home</Link>
          {user ? (
            <>
              <Link to="/profile">Profile</Link>
              <button className="link-like" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/login" element={<Login onLogin={(u) => { setUser(u); localStorage.setItem('ow_user', JSON.stringify(u)); navigate('/profile') }} />} />
          <Route path="/profile" element={<Profile user={user} />} />
        </Routes>
      </main>

      <footer>
        <small>Demo app for OpenAI workflow integration</small>
      </footer>
    </div>
  )
}

function Home({ user }) {
  return (
    <section>
      <h2>Welcome{user ? `, ${user.firstName}` : ''}!</h2>
      <p>This is a minimal demo app. Use Login to create a mock user.</p>
    </section>
  )
}

export default App
