import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookService } from '../../services/roomService'; // To fetch pending bookings count
import './AdminPages.css';

const AdminDashboardPage = () => {
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  useEffect(() => {
    const fetchCount = async () => {
      setLoadingCount(true);
      try {
        // Assuming getBookingsForHotel with null hotelId fetches for all, and supports validationStatus filter
        const pending = await bookService.getBookingsForHotel(null, { validationStatus: 'Pending' });
        setPendingBookingsCount(pending.length);
      } catch (error) {
        console.error("Error fetching pending bookings count:", error);
        // Optionally set an error state here
      } finally {
        setLoadingCount(false);
      }
    };
    fetchCount();
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Administrator Dashboard</h1>
      </header>
      <nav className="admin-nav">
        <Link to="/admin/manage-hotels" className="admin-nav-link">Manage Hotels</Link>
        <Link to="/admin/manage-tariffs" className="admin-nav-link">Manage Tariffs</Link>
        <Link to="/admin/manage-agents" className="admin-nav-link">Manage Agents</Link>
        <Link to="/admin/validate-bookings" className="admin-nav-link">
          Validate Bookings
          {loadingCount ? " (...)" : pendingBookingsCount > 0 ? <span className="pending-badge">{pendingBookingsCount}</span> : ""}
        </Link>
        <Link to="/admin/statistics" className="admin-nav-link">View Statistics</Link>
      </nav>
      <main className="admin-content">
        <p>Welcome, Administrator. Please select an option to proceed.</p>

        {loadingCount && <p>Loading dashboard data...</p>}
        {!loadingCount && pendingBookingsCount > 0 && (
          <div className="admin-alert-box">
            <p><strong>Action Required:</strong> There are <Link to="/admin/validate-bookings">{pendingBookingsCount} booking(s)</Link> awaiting your validation.</p>
          </div>
        )}

        <div className="admin-info-box">
          <p><strong>Note on Security:</strong> Two-Factor Authentication (2FA) is conceptually required for admin access but not fully implemented in this mock frontend.</p>
        </div>
      </main>
    </div>
  );
};
export default AdminDashboardPage;
