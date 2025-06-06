import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookService } from '../../services/roomService';
import { getCurrentUser } from '../../services/authService';
import './MyBookingsPage.css';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const fetchUserDataAndBookings = async () => {
      setLoading(true);
      setError('');
      try {
        const user = await getCurrentUser();
        if (!user) {
          setError("You need to be logged in to view your bookings. Redirecting to login...");
          setLoading(false);
          setTimeout(() => navigate('/login', { state: { from: { pathname: '/my-bookings'} } }), 2000);
          return;
        }
        setCurrentUser(user);
        const userBookings = await bookService.getUserBookings(user.id);
        setBookings(userBookings);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        setError(err.message || "Failed to fetch your bookings.");
      } finally {
        setLoading(false);
      }
    };
    fetchUserDataAndBookings();
  }, [navigate]);

  const handleCancelBooking = async (bookingId) => {
    if (!currentUser || !bookingId) return;
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    setLoading(true);
    setFeedback('');
    try {
        const response = await bookService.cancelBooking(bookingId, currentUser.id);
        setFeedback(response.message || 'Booking status updated.');
        // Refresh bookings list
        const updatedBookings = await bookService.getUserBookings(currentUser.id);
        setBookings(updatedBookings);
    } catch (err) {
        console.error("Error cancelling booking:", err);
        setFeedback(err.message || "Failed to cancel booking.");
    } finally {
        setLoading(false);
    }
  };

  const handleModifyBooking = (bookingId) => {
    // In a real app, this might navigate to a new page or open a modal
    // For example: navigate(`/modify-booking/${bookingId}`);
    setFeedback(`Modification for booking ${bookingId} is not yet implemented.`);
    console.log(`Attempting to modify booking: ${bookingId}`);
  };

  const calculateTotalPrice = (startDate, endDate, pricePerNight) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || end < start || !pricePerNight) return 'N/A';
    const diffTime = Math.abs(end - start);
    // Calculate difference in days. If start and end are same day, it's 1 day for hotel booking.
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    return `$${(diffDays * pricePerNight).toFixed(2)}`;
  };

  if (loading && bookings.length === 0 && !error) { // Show initial loading only if no error
    return <div className="my-bookings-page">Loading your bookings...</div>;
  }

  // If there's an error message, display it (could be "redirecting to login" or "failed to fetch")
  if (error) {
    return <div className="my-bookings-page"><p className="error-message">{error}</p></div>;
  }

  return (
    <div className="my-bookings-page">
      <h2>My Bookings</h2>
      {feedback && <p className={feedback.toLowerCase().includes("success") || feedback.toLowerCase().includes("updated") ? "success-message" : "error-message"}>{feedback}</p>}
      {bookings.length === 0 && !loading && ( // Ensure not loading when showing "no bookings"
        <div className="no-bookings">
            <p>You have no bookings yet.</p>
            <button onClick={() => navigate('/rooms')} className="book-now-btn">Book a Room</button>
        </div>
      )}
      {bookings.length > 0 && (
        <div className="bookings-list">
          {bookings.map(booking => (
            <div key={booking.bookingId} className={`booking-card status-${booking.status?.toLowerCase()}`}>
              <div className="booking-card-header">
                <h3>{booking.roomName}</h3>
                <span className={`status-badge status-${booking.status?.toLowerCase()}`}>{booking.status}</span>
              </div>
              <p><strong>Location:</strong> {booking.roomLocation}</p>
              <p><strong>Dates:</strong> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
              <p><strong>Total Price:</strong> {calculateTotalPrice(booking.startDate, booking.endDate, booking.roomPrice)}</p>
              <p><strong>Booked On:</strong> {new Date(booking.bookedAt).toLocaleString()}</p>
              <p><strong>Booking ID:</strong> {booking.bookingId}</p>
              <div className="booking-actions">
                {booking.status === 'Confirmed' && (
                  <>
                    <button onClick={() => handleModifyBooking(booking.bookingId)} className="action-btn modify-btn">Modify</button>
                    <button onClick={() => handleCancelBooking(booking.bookingId)} className="action-btn cancel-btn">Cancel</button>
                  </>
                )}
                {booking.status === 'Cancelled' && (
                     <button onClick={() => navigate('/rooms')} className="action-btn book-again-btn">Book Again</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default MyBookingsPage;
