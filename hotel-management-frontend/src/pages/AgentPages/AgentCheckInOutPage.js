import React, { useState, useEffect, useCallback } from 'react';
import { bookService, getHotels } from '../../services/roomService';
import { getCurrentUser } from '../../services/authService'; // To get current agent's ID
import './AgentPages.css'; // Shared agent page styles

const AgentCheckInOutPage = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [currentAgent, setCurrentAgent] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Default to today
  const [filterStatus, setFilterStatus] = useState(''); // e.g., Confirmed, Checked-in

  // Consumption Modal State
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [currentBookingForConsumption, setCurrentBookingForConsumption] = useState(null);
  const [consumptionItemName, setConsumptionItemName] = useState('');
  const [consumptionItemPrice, setConsumptionItemPrice] = useState('');
  const [consumptionItemQuantity, setConsumptionItemQuantity] = useState(1);


  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const agent = await getCurrentUser();
        setCurrentAgent(agent); // Assuming agent is logged in via authService
        const hotelData = await getHotels();
        setHotels(hotelData);
        if (hotelData.length > 0) {
          // setSelectedHotelId(hotelData[0].id); // Auto-select first hotel
        }
      } catch (err) {
        setError("Failed to load initial hotel data.");
        console.error(err);
      }
    };
    loadInitialData();
  }, []);

  const fetchBookingsForHotel = useCallback(async () => {
    if (!selectedHotelId) {
      setBookings([]);
      setFilteredBookings([]);
      return;
    }
    setLoading(true); setError(''); setFeedback('');
    try {
      // The service function getBookingsForHotel is designed to take all filters.
      // However, the current UI implementation fetches all for a hotel then filters client-side.
      // This can be optimized later by passing all filters to the service if performance dictates.
      const fetchedBookings = await bookService.getBookingsForHotel(selectedHotelId, {});
      setBookings(fetchedBookings);
    } catch (err) {
      setError(err.message || "Failed to fetch bookings.");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedHotelId]);

  useEffect(() => {
    fetchBookingsForHotel(); // Refetch when selectedHotelId changes
  }, [selectedHotelId, fetchBookingsForHotel]);

  // Client-side filtering based on fetched bookings
  useEffect(() => {
    let currentBookings = [...bookings];
    if (filterStatus) {
        currentBookings = currentBookings.filter(b => b.status === filterStatus);
    }
    if (filterDate) {
        const fDate = new Date(filterDate);
        fDate.setHours(0,0,0,0); // Normalize filter date
        currentBookings = currentBookings.filter(b => {
            const startDate = new Date(b.startDate);
            const endDate = new Date(b.endDate);
            startDate.setHours(0,0,0,0);
            endDate.setHours(0,0,0,0);
            // Booking is active on filterDate if:
            // startDate <= fDate < endDate (for multi-day stays, checkout day is not counted as active)
            // or if it's a single day booking: startDate === fDate
            return startDate <= fDate && fDate < endDate;
        });
    }
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        currentBookings = currentBookings.filter(b =>
            b.clientName?.toLowerCase().includes(term) ||
            b.bookingId?.toLowerCase().includes(term) ||
            b.roomName?.toLowerCase().includes(term)
        );
    }
    setFilteredBookings(currentBookings);
  }, [bookings, searchTerm, filterDate, filterStatus]);


  const handleUpdateStatus = async (bookingId, newStatus) => {
    if (!currentAgent) {
      setFeedback("Agent not identified. Cannot update status.");
      return;
    }
    setLoading(true); setFeedback('');
    try {
      const result = await bookService.updateBookingStatus(bookingId, newStatus, currentAgent.id);
      setFeedback(result.message || `Booking ${bookingId} status updated.`);
      fetchBookingsForHotel(); // Refresh list
    } catch (err) {
      setFeedback(err.message || "Failed to update booking status.");
      setError(err.message || "Failed to update booking status."); // Also set error for visibility
    } finally {
      setLoading(false);
    }
  };

  const openAddConsumptionModal = (booking) => {
    setCurrentBookingForConsumption(booking);
    setShowConsumptionModal(true);
    setConsumptionItemName('');
    setConsumptionItemPrice('');
    setConsumptionItemQuantity(1);
  };

  const handleAddConsumption = async (e) => {
    e.preventDefault();
    if (!currentBookingForConsumption || !consumptionItemName || !consumptionItemPrice) {
        setFeedback("Item name and price are required.");
        return;
    }
    setLoading(true); setFeedback(''); // Clear previous feedback
    try {
        const item = {
            itemName: consumptionItemName,
            price: parseFloat(consumptionItemPrice),
            quantity: parseInt(consumptionItemQuantity, 10) || 1
        };
        await bookService.addConsumptionToBooking(currentBookingForConsumption.bookingId, item);
        setFeedback("Consumption added successfully.");
        fetchBookingsForHotel(); // Refresh booking details (consumptions)
        setShowConsumptionModal(false);
    } catch (err) {
        setFeedback(err.message || "Failed to add consumption.");
        setError(err.message || "Failed to add consumption."); // Also set error for visibility
    } finally {
        setLoading(false);
    }
  };


  return (
    <div className="agent-page">
      <header className="agent-header">
        <h1>Manage Check-in / Check-out</h1>
      </header>
      <main className="agent-content">
        {error && <p className="error-message">{error}</p>}
        {feedback && <p className={feedback.includes("success") ? "success-message" : "error-message"}>{feedback}</p>}

        <div className="filters-bar">
          <select value={selectedHotelId} onChange={(e) => setSelectedHotelId(e.target.value)} required>
            <option value="">Select Hotel to Manage</option>
            {hotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} title="Filter by active date" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Confirmed">Confirmed (Arrivals)</option>
            <option value="Checked-in">Checked-in (In-House)</option>
            <option value="Checked-out">Checked-out (Departed)</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No-show">No-show</option>
          </select>
          <input type="text" placeholder="Search Client, Room, Booking ID..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>

        {loading && <p>Loading bookings...</p>}

        {!loading && !selectedHotelId && <p>Please select a hotel to view bookings.</p>}
        {!loading && selectedHotelId && filteredBookings.length === 0 && <p>No bookings match the current criteria.</p>}

        <div className="bookings-grid">
          {filteredBookings.map(booking => (
            <div key={booking.bookingId} className={`booking-entry status-${booking.status?.toLowerCase().replace(/\s+/g, '-')}`}>
              <h4>{booking.roomName} ({booking.roomType})</h4>
              <p><strong>Client:</strong> {booking.clientName} ({booking.clientEmail})</p>
              <p><strong>Booking ID:</strong> {booking.bookingId}</p>
              <p><strong>Dates:</strong> {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <span className={`status-text status-${booking.status?.toLowerCase().replace(/\s+/g, '-')}`}>{booking.status}</span></p>
              <p><strong>Total Price (Room):</strong> ${booking.roomPrice ? (booking.roomPrice * ( Math.max(1, (new Date(booking.endDate) - new Date(booking.startDate))/(1000*60*60*24) ))).toFixed(2) : 'N/A'}</p>
              {booking.consumptions && booking.consumptions.length > 0 && (
                <div className="consumptions-summary">
                  <strong>Consumptions:</strong>
                  <ul>
                    {booking.consumptions.map(c => <li key={c.id}>{c.itemName} (x{c.quantity}) - ${c.price * c.quantity}</li>)}
                  </ul>
                  <p>Total Consumptions: ${booking.consumptions.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toFixed(2)}</p>
                </div>
              )}
              <div className="booking-actions">
                {booking.status === 'Confirmed' && (
                  <button onClick={() => handleUpdateStatus(booking.bookingId, 'Checked-in')} className="action-btn checkin-btn">Check-in</button>
                )}
                {booking.status === 'Checked-in' && (
                  <>
                    <button onClick={() => handleUpdateStatus(booking.bookingId, 'Checked-out')} className="action-btn checkout-btn">Check-out</button>
                    <button onClick={() => openAddConsumptionModal(booking)} className="action-btn consumption-btn">Add Consumption</button>
                  </>
                )}
                 {booking.status === 'Confirmed' && (
                    <button onClick={() => handleUpdateStatus(booking.bookingId, 'No-show')} className="action-btn noshow-btn">Mark No-Show</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {showConsumptionModal && currentBookingForConsumption && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Consumption for {currentBookingForConsumption.roomName} ({currentBookingForConsumption.clientName})</h3>
            <form onSubmit={handleAddConsumption}>
              <div className="form-group">
                <label htmlFor="itemName">Item Name:</label>
                <input type="text" id="itemName" value={consumptionItemName} onChange={e => setConsumptionItemName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="itemPrice">Price (per unit):</label>
                <input type="number" id="itemPrice" value={consumptionItemPrice} onChange={e => setConsumptionItemPrice(e.target.value)} required min="0" step="0.01" />
              </div>
              <div className="form-group">
                <label htmlFor="itemQuantity">Quantity:</label>
                <input type="number" id="itemQuantity" value={consumptionItemQuantity} onChange={e => setConsumptionItemQuantity(e.target.value)} required min="1" step="1" />
              </div>
              <div className="modal-actions">
                <button type="submit" disabled={loading}>{loading ? "Adding..." : "Add Item"}</button>
                <button type="button" onClick={() => setShowConsumptionModal(false)} className="cancel-btn" disabled={loading}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AgentCheckInOutPage;
