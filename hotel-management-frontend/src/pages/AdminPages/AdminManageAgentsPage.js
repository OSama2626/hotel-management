import React, { useState, useEffect } from 'react';
import { getAllUsers, adminUpdateUserRole, adminResetUserPassword, getCurrentUser } from '../../services/authService';
import './AdminPages.css'; // Shared admin styles

const AdminManageAgentsPage = () => {
  const [users, setUsers] = useState([]);
  const [currentAdmin, setCurrentAdmin] = useState(null); // State for current admin user
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch both all users and the current admin user concurrently
      const [allUsersResponse, currentAdminResponse] = await Promise.all([
        getAllUsers(),
        getCurrentUser()
      ]);
      setUsers(allUsersResponse);
      setCurrentAdmin(currentAdminResponse);
    } catch (err) {
      setError("Failed to fetch users or current admin details.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    setFeedback(''); setError('');
    if (!window.confirm(\`Are you sure you want to change this user's role to \${newRole}?\`)) return;

    // Prevent changing the role of the current admin if they are the only admin
    if (currentAdmin && userId === currentAdmin.id && currentAdmin.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1 && newRole !== 'admin') {
        setError("Cannot change the role of the sole administrator to a non-admin role.");
        return;
    }

    try {
      await adminUpdateUserRole(userId, newRole);
      setFeedback(\`User role updated successfully. New role: \${newRole}\`);
      fetchData(); // Re-fetch all data to show updated roles and potentially currentAdmin if changed
    } catch (err) {
      setError(err.message || "Failed to update role.");
      setFeedback('');
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
      setFeedback('');
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
            {users.map(user => {
              // Determine if the role select should be disabled for this user
              let isRoleSelectDisabled = false;
              // Logic to disable changing role of the sole admin
              if (user.role === 'admin' && currentAdmin && user.id === currentAdmin.id && users.filter(u => u.role === 'admin').length <= 1) {
                  isRoleSelectDisabled = true;
              }

              return (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td className="actions">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={isRoleSelectDisabled} // Disables select if true
                      aria-label={`Change role for ${user.name}`}
                    >
                      <option value="client">Client</option>
                      <option value="agent">Agent</option>
                      {/* Admin role can only be selected if user is already admin, and select is not disabled */}
                      <option value="admin" disabled={user.role !== 'admin' && !isRoleSelectDisabled}>Admin</option>
                    </select>
                    <button
                      onClick={() => handlePasswordReset(user.id)}
                      className="edit-btn"
                      style={{marginLeft: '10px'}}
                      aria-label={`Reset password for ${user.name}`}
                    >
                      Reset Password (Mock)
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {users.length === 0 && !loading && <p>No users found.</p>}
      </main>
    </div>
  );
};
export default AdminManageAgentsPage;
