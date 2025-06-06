import React, { useState, useEffect, useCallback } from 'react';
import { bookService, getHotelById } from '../../services/roomService'; // Added getHotelById
import { getCurrentUser } from '../../services/authService'; // To get current admin's ID
import './AdminPages.css'; // Shared admin styles

const AdminValidateBookingsPage = () => {
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [hotelNames, setHotelNames] = useState({}); // To store hotel names

  const fetchHotelName = useCallback(async (hotelId) => {
    if (hotelNames[hotelId]) return hotelNames[hotelId]; // Cache lookup
    try {
      const hotel = await getHotelById(hotelId);
      setHotelNames(prev => ({ ...prev, [hotelId]: hotel.name }));
      return hotel.name;
    } catch (err) {
      console.error(`Failed to fetch hotel name for ${hotelId}:`, err);
      return hotelId; // Fallback to ID if name fetch fails
    }
  }, [hotelNames]); // hotelNames in dependency to avoid re-fetching if already fetched

  const fetchPendingBookings = useCallback(async () => {
    setLoading(true); setError(''); setFeedback('');
    try {
      const bookings = await bookService.getBookingsForHotel(null, { validationStatus: 'Pending' });
      // Enrich bookings with hotel names
      const enrichedBookings = await Promise.all(
        bookings.map(async (booking) => {
          const hotelName = await fetchHotelName(booking.hotelId);
          return { ...booking, hotelDisplayName: hotelName };
        })
      );
      setPendingBookings(enrichedBookings);
    } catch (err) {
      setError(err.message || "Failed to fetch bookings pending validation.");
      setPendingBookings([]);
    } finally {
      setLoading(false);
    }
  }, [fetchHotelName]); // fetchHotelName is now a dependency

  useEffect(() => {
    const loadAdminAndBookings = async () => {
        try {
            const admin = await getCurrentUser();
            setCurrentAdmin(admin);
            if (!admin) { // Check if admin is null (not logged in as admin)
                setError("Administrator privileges required. Please log in as an admin.");
                setLoading(false);
                return;
            }
        } catch (err) {
            setError("Could not identify current administrator.");
            setLoading(false); // Stop loading if admin check fails
            return; // Stop further execution
        }
        fetchPendingBookings();
    };
    loadAdminAndBookings();
  }, [fetchPendingBookings]);

  const handleApprove = async (bookingId) => {
    if (!currentAdmin) { setError("Admin user not identified."); return; }
    setFeedback(''); setError('');
    try {
      await bookService.adminApproveBooking(bookingId, currentAdmin.id);
      setFeedback(`Booking ${bookingId} approved successfully.`);
      fetchPendingBookings(); // Refresh list
    } catch (err) {
      setError(err.message || "Failed to approve booking.");
    }
  };

  const handleReject = async (bookingId) => {
    if (!currentAdmin) { setError("Admin user not identified."); return; }
    setFeedback(''); setError('');
    const reason = prompt("Please provide a reason for rejecting this booking:");
    if (reason === null) return; // User cancelled prompt
    if (!reason.trim()) {
      setError("A reason is required for rejection.");
      return;
    }
    try {
      await bookService.adminRejectBooking(bookingId, currentAdmin.id, reason);
      setFeedback(`Booking ${bookingId} rejected successfully.`);
      fetchPendingBookings(); // Refresh list
    } catch (err) {
      setError(err.message || "Failed to reject booking.");
    }
  };

  if (loading) return <div className="admin-page"><p>Loading bookings for validation...</p></div>;

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Validate Pending Bookings</h1>
      </header>
      <main className="admin-content">
        {error && <p className="error-message">{error}</p>}
        {feedback && <p className="success-message">{feedback}</p>}

        {pendingBookings.length === 0 && !loading && (
          <p>There are no bookings currently pending administrative validation.</p>
        )}

        <table className="admin-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Client</th>
              <th>Room</th>
              <th>Hotel</th>
              <th>Dates</th>
              <th>Price/Night</th>
              <th>Booked At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingBookings.map(booking => (
              <tr key={booking.bookingId}>
                <td>{booking.bookingId}</td>
                <td>{booking.clientName || 'N/A'} ({booking.userId})</td>
                <td>{booking.roomName || 'N/A'}</td>
                <td>{booking.hotelDisplayName || booking.hotelId}</td>
                <td>{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</td>
                <td>${booking.bookedPricePerNight !== undefined ? booking.bookedPricePerNight.toFixed(2) : 'N/A'}</td>
                <td>{new Date(booking.bookedAt).toLocaleString()}</td>
                <td className="actions">
                  <button onClick={() => handleApprove(booking.bookingId)} className="approve-btn">Approve</button>
                  <button onClick={() => handleReject(booking.bookingId)} className="reject-btn">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
};
export default AdminValidateBookingsPage;
