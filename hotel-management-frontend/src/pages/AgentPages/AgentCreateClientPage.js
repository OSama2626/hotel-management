import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/authService'; // Assuming this can be used by agent
import './AgentPages.css';

const AgentCreateClientPage = () => {
  // const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Agent might set a temporary password
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRegisterClient = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      // Note: authService.registerUser might need adjustment if it auto-logs-in user,
      // or if agent needs to set a specific role/type for user. For mock, this is fine.
      const response = await registerUser({ name, email, password });
      setSuccess(`Client ${response.user.name} registered successfully. ID: ${response.user.id}`);
      setName(''); setEmail(''); setPassword('');
      // In a real app, might redirect or offer to make a booking for this new client
      // navigate('/agent/create-booking', { state: { clientId: response.user.id } });
    } catch (err) {
      setError(err.message || "Failed to register client.");
    }
  };

  return (
    <div className="agent-page">
      <h2>Register New Client</h2>
      <form onSubmit={handleRegisterClient} className="agent-form">
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <div className="form-group">
          <label htmlFor="name">Client Name:</label>
          <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Client Email:</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="password">Temporary Password:</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Register Client</button>
      </form>
    </div>
  );
};
export default AgentCreateClientPage;
