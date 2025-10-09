import React, { useState } from 'react'

export default function Login({ onLogin }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!firstName || !lastName || !email) {
      setError('Lütfen ad, soyad ve e-posta girin.')
      return
    }
    const user = { firstName, lastName, email, phone }
    onLogin(user)
  }

  return (
    <section className="card">
      <h2>Login / Create Account</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Ad
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label>
          Soyad
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <label>
          E-posta
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>
          Telefon (opsiyonel)
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit">Giriş / Oluştur</button>
      </form>
    </section>
  )
}
