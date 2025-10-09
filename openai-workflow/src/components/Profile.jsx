import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Profile({ user }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    setForm(user)
  }, [user])

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function save() {
    localStorage.setItem('ow_user', JSON.stringify(form))
    alert('Kaydedildi')
  }

  return (
    <section className="card">
      <h2>Profil</h2>
      <label>
        Ad
        <input name="firstName" value={form.firstName} onChange={handleChange} />
      </label>
      <label>
        Soyad
        <input name="lastName" value={form.lastName} onChange={handleChange} />
      </label>
      <label>
        E-posta
        <input name="email" value={form.email} onChange={handleChange} />
      </label>
      <label>
        Telefon
        <input name="phone" value={form.phone} onChange={handleChange} />
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={save}>Kaydet</button>
      </div>
    </section>
  )
}
