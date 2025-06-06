// hotel-management-frontend/src/pages/BookingPage/BookingPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // Import hooks
import { getRoomById, bookService } from '../../services/roomService';
import { getCurrentUser } from '../../services/authService';
import './BookingPage.css';

const BookingPage = () => {
  const { roomId } = useParams(); // Get roomId from URL
  const navigate = useNavigate(); // For redirecting
  const location = useLocation(); // To get state passed from RoomListPage

  const [room, setRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [bookingDetails, setBookingDetails] = useState({
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const passedState = location.state || {}; // Get dates passed from RoomListPage
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(today);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    setBookingDetails({
      startDate: passedState.startDate || tomorrow.toISOString().split('T')[0],
      endDate: passedState.endDate || dayAfterTomorrow.toISOString().split('T')[0]
    });

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (!roomId) {
            setError("No Room ID provided.");
            setLoading(false);
            return;
        }
        const roomData = await getRoomById(roomId);
        setRoom(roomData);
        const userData = await getCurrentUser(); // Check if user is logged in
        setCurrentUser(userData);

      } catch (err) {
        console.error("Error fetching room or user details:", err);
        setError(err.message || 'Failed to load booking details. The room may not exist or the service is unavailable.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [roomId, location.state]); // Add location.state to dependencies

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError("You must be logged in to book a room. Redirecting to login...");
      setTimeout(() => navigate('/login', { state: { from: location } }), 2000); // Redirect to login, pass current location
      return;
    }
    if (!room) {
        setError("Room details not loaded. Cannot proceed with booking.");
        return;
    }
    if (!bookingDetails.startDate || !bookingDetails.endDate) {
        setError("Please select start and end dates for your booking.");
        return;
    }
    // Basic date validation: end date should not be before start date
    if (new Date(bookingDetails.endDate) < new Date(bookingDetails.startDate)) {
        setError("End date cannot be before start date.");
        return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const bookingResponse = await bookService.createBooking(
        roomId,
        currentUser.id,
        bookingDetails.startDate,
        bookingDetails.endDate
      );
      setSuccess(`Booking successful! Your booking ID is ${bookingResponse.bookingId}. Confirmation likely sent to ${currentUser.email}.`);
      console.log("Booking confirmed:", bookingResponse);
      // setTimeout(() => navigate('/my-bookings'), 3000); // Redirect to a booking history page (to be created)
    } catch (err) {
      console.error("Booking failed:", err);
      setError(err.message || 'Failed to confirm booking. The room might have become unavailable.');
    } finally {
      setLoading(false);
    }
  };

  if (!roomId && !loading) return <div className="booking-page"><p className="error-message">No room selected for booking. Please select a room first.</p><button onClick={() => navigate('/rooms')}>View Rooms</button></div>;
  if (loading && !room) return <div className="booking-page">Loading booking details...</div>;
  // If there was an error fetching the room (e.g. room not found) and not just a general error after room loaded
  if (error && !room && !loading) return <div className="booking-page"><p className="error-message">{error}</p><button onClick={() => navigate('/rooms')}>View Other Rooms</button></div>;


  return (
    <div className="booking-page">
      <h2>Confirm Your Booking</h2>
      {room ? (
        <div className="room-details-summary">
          <h3>{room.name}</h3>
          <p>Type: {room.type}</p>
          <p>Hotel: {room.location}</p> {/* Assuming location is hotel name for now */}
          <p>Price: ${room.price}/night</p>
          {room.amenities && <p>Amenities: {room.amenities.join(', ')}</p>}
        </div>
      ) : !loading && <p>Room details could not be loaded.</p>}

      <form onSubmit={handleConfirmBooking} className="booking-form">
        {error && !success && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <div className="form-group">
          <label htmlFor="startDate">Start Date:</label>
          <input
            type="date"
            id="startDate"
            name="startDate"
            value={bookingDetails.startDate}
            onChange={handleInputChange}
            required
            disabled={!!success} // Disable if booking is successful
          />
        </div>
        <div className="form-group">
          <label htmlFor="endDate">End Date:</label>
          <input
            type="date"
            id="endDate"
            name="endDate"
            value={bookingDetails.endDate}
            onChange={handleInputChange}
            required
            disabled={!!success} // Disable if booking is successful
          />
        </div>

        {currentUser ? <p>Booking for: {currentUser.name} ({currentUser.email})</p> : <p>Please log in to complete your booking.</p>}

        <button type="submit" disabled={loading || !!success || !room}>
          {loading ? 'Processing...' : success ? 'Booked!' : 'Confirm & Pay (Mock)'}
        </button>
      </form>
      {success && <button onClick={() => navigate('/rooms')}>Book Another Room</button>}
      {/* Consider adding a link to a future 'My Bookings' page:
      {success && <button onClick={() => navigate('/my-bookings')}>View My Bookings</button>}
      */}
    </div>
  );
};

export default BookingPage;
