import React from 'react';
import { Link } from 'react-router-dom';
import './AgentPages.css';

const AgentDashboardPage = () => {
  return (
    <div className="agent-page">
      <header className="agent-header">
        <h1>Reception Agent Dashboard</h1>
      </header>
      <nav className="agent-nav">
        <Link to="/agent/create-booking" className="agent-nav-link">New Booking for Client</Link>
        <Link to="/agent/create-client" className="agent-nav-link">Register New Client</Link>
        <Link to="/agent/manage-checkinout" className="agent-nav-link">Manage Check-in/Check-out</Link>
        <Link to="/agent/billing" className="agent-nav-link">Client Billing</Link> {/* Added this link */}
      </nav>
      <main className="agent-content">
        <p>Welcome, Agent. Please select an option to proceed.</p>
      </main>
    </div>
  );
};
export default AgentDashboardPage;
