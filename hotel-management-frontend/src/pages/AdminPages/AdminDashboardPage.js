import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookService } from '../../services/roomService'; // To fetch pending bookings count
import { getAllBookingsFeedback } from '../../services/feedbackService';
import './AdminPages.css';

const AdminDashboardPage = () => {
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);
  const [allFeedback, setAllFeedback] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);

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

  useEffect(() => {
    const fetchFeedback = async () => {
        try {
            setFeedbackLoading(true);
            const feedbackData = await getAllBookingsFeedback();
            // Sort feedback by timestamp, newest first
            feedbackData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setAllFeedback(feedbackData);
        } catch (error) {
            console.error("Error fetching feedback for admin:", error);
            // Optionally set an error state for feedback
        } finally {
            setFeedbackLoading(false);
        }
    };
    fetchFeedback();
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

        {/* User Feedback Section */}
        <div className="admin-section feedback-dashboard-section">
            <h2>User Feedback</h2>
            {feedbackLoading ? (
                <p>Loading feedback...</p>
            ) : allFeedback.length === 0 ? (
                <p>No feedback submitted yet.</p>
            ) : (
                <ul className="feedback-list-admin">
                    {allFeedback.map(fb => (
                        <li key={fb.id} className="feedback-item-admin">
                            <p><strong>Booking ID:</strong> {fb.bookingId}</p>
                            <p><strong>User ID:</strong> {fb.userId}</p>
                            <p><strong>Rating:</strong> {'★'.repeat(fb.rating)}{'☆'.repeat(5 - fb.rating)} ({fb.rating}/5)</p>
                            <p><strong>Comment:</strong> {fb.comment}</p>
                            <p><strong>Date:</strong> {new Date(fb.timestamp).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </main>
    </div>
  );
};
export default AdminDashboardPage;
