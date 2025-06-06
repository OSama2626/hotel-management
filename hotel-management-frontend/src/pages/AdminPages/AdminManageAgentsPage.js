import React, { useState, useEffect } from 'react';
import { getAllUsers, adminUpdateUserRole, adminResetUserPassword } from '../../services/authService';
import './AdminPages.css'; // Shared admin styles

const AdminManageAgentsPage = () => {
  const [users, setUsers] = useState([]);
  // const [agents, setAgents] = useState([]); // We will display all users and manage roles
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchAllUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
      // setAgents(allUsers.filter(user => user.role !== 'admin')); // Filtered out admin for agent management
    } catch (err) {
      setError("Failed to fetch users.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setFeedback(''); setError('');
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      await adminUpdateUserRole(userId, newRole);
      setFeedback(`User role updated successfully. New role: ${newRole}`);
      fetchAllUsers(); // Re-fetch to show updated role
    } catch (err) {
      setError(err.message || "Failed to update role.");
      setFeedback(''); // Clear feedback if error
    }
  };

  const handlePasswordReset = async (userId) => {
    setFeedback(''); setError('');
    if (!window.confirm("Are you sure you want to reset this user's password? (This is a mock action)")) return;
    try {
      const result = await adminResetUserPassword(userId);
      setFeedback(result.message);
    } catch (err) {
      setError(err.message || "Failed to reset password.");
      setFeedback(''); // Clear feedback if error
    }
  };

  if (loading) return <div className="admin-page"><p>Loading users...</p></div>;


  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Manage Users & Roles</h1>
      </header>
      <main className="admin-content">
        {error && <p className="error-message">{error}</p>}
        {feedback && <p className={error ? "error-message" : "success-message"}>{feedback}</p>}

        {/* TODO: Add form to create/invite new agent user with a specific role */}

        <h3>Users List</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td className="actions">
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    // Prevent admin from easily changing their own role or another admin's role via this UI for safety
                    disabled={user.role === 'admin' && users.filter(u => u.role ==='admin').length <=1 && user.id === getAllUsers.caller?.id /*This is pseudo check, real check needed*/}
                  >
                    <option value="client">Client</option>
                    <option value="agent">Agent</option>
                    {/* Admin role should be managed more carefully, perhaps not from a simple dropdown */}
                    <option value="admin" disabled={user.role !== 'admin'}>Admin</option>
                  </select>
                  <button onClick={() => handlePasswordReset(user.id)} className="edit-btn" style={{marginLeft: '10px'}}>
                    Reset Password (Mock)
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && <p>No users found.</p>}
      </main>
    </div>
  );
};
export default AdminManageAgentsPage;
