import React, { useState } from 'react';
import './RegistrationPage.css';
import { registerUser } from '../../services/authService'; // Import the service

const RegistrationPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const response = await registerUser({ name, email, password });
      setSuccess(response.message + ' You can now log in.');
      console.log('Registration successful:', response.user);
      // Clear form
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.message);
      console.error('Registration failed:', err.message);
    }
  };

  return (
    <div className="registration-page">
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default RegistrationPage;
