import React, { useState, useEffect, useCallback } from 'react';
import { bookService, getHotels } from '../../services/roomService';
import './AgentPages.css'; // Shared agent page styles

const AgentBillingPage = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [checkedOutBookings, setCheckedOutBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookingForBill, setSelectedBookingForBill] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const loadHotels = async () => {
      try {
        const hotelData = await getHotels();
        setHotels(hotelData);
        if (hotelData.length > 0) {
          // Optionally auto-select first hotel or require manual selection
        }
      } catch (err) {
        setError("Failed to load hotel data.");
        console.error(err);
      }
    };
    loadHotels();
  }, []);

  const fetchCheckedOutBookings = useCallback(async () => {
    if (!selectedHotelId) {
      setCheckedOutBookings([]);
      return;
    }
    setLoading(true); setError(''); setFeedback(''); setSelectedBookingForBill(null);
    try {
      // The service getBookingsForHotel can filter by status and searchTerm
      const params = {
        status: 'Checked-out',
        searchTerm: searchTerm
      };
      const fetchedBookings = await bookService.getBookingsForHotel(selectedHotelId, params);

      setCheckedOutBookings(fetchedBookings);

      if (fetchedBookings.length === 0 && searchTerm) {
        setFeedback("No checked-out bookings found matching your search for this hotel.");
      } else if (fetchedBookings.length === 0) {
        setFeedback("No checked-out bookings found for this hotel.");
      }

    } catch (err) {
      setError(err.message || "Failed to fetch checked-out bookings.");
      setCheckedOutBookings([]);
    } finally {
      setLoading(false);
    }
  }, [selectedHotelId, searchTerm]); // searchTerm is now a dependency

  useEffect(() => {
    // Fetch when hotel changes or search term is cleared by other means (though search is manual via button)
    if (selectedHotelId) {
        fetchCheckedOutBookings();
    } else {
        setCheckedOutBookings([]);
    }
  }, [selectedHotelId, fetchCheckedOutBookings]); // fetchCheckedOutBookings includes searchTerm

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCheckedOutBookings(); // Manually trigger search on button click
  };

  const calculateRoomTotal = (booking) => {
    if (!booking || !booking.roomPrice || !booking.startDate || !booking.endDate) return 0;
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);
    const nights = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24))); // Ensure at least 1 night
    return nights * booking.roomPrice;
  };

  const calculateConsumptionsTotal = (booking) => {
    if (!booking || !booking.consumptions || booking.consumptions.length === 0) return 0;
    return booking.consumptions.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleGeneratePdf = (booking) => {
    setFeedback(`Simulating PDF generation for Booking ID: ${booking.bookingId}. Data: (Room: $${calculateRoomTotal(booking).toFixed(2)}, Consumptions: $${calculateConsumptionsTotal(booking).toFixed(2)})`);
    console.log("Generate PDF for:", booking);
    // In a real app, this would call a PDF generation library or API
  };

  const handleSendEmail = (booking) => {
    setFeedback(`Simulating sending email for Booking ID: ${booking.bookingId} to ${booking.clientEmail}.`);
    console.log("Send Email for:", booking);
    // In a real app, this would call an email service
  };

  return (
    <div className="agent-page">
      <header className="agent-header">
        <h1>Client Billing</h1>
      </header>
      <main className="agent-content">
        {error && <p className="error-message">{error}</p>}
        {feedback && <p className={feedback.includes("Simulating") || feedback.includes("Failed") ? "info-message" : "success-message"}>{feedback}</p>}

        <div className="filters-bar">
          <select value={selectedHotelId} onChange={(e) => {setSelectedHotelId(e.target.value); setSelectedBookingForBill(null); setSearchTerm('');}} required>
            <option value="">Select Hotel</option>
            {hotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
          </select>
          <input
            type="text"
            placeholder="Search Booking ID, Client, Room..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!selectedHotelId}
          />
          <button onClick={handleSearch} disabled={!selectedHotelId || loading}>
            {loading ? 'Searching...' : 'Search Bookings'}
          </button>
        </div>

        {!selectedHotelId && <p>Please select a hotel to view bookings for billing.</p>}

        {selectedHotelId && !selectedBookingForBill && (
            <>
            {loading && <p>Loading checked-out bookings...</p>}
            {!loading && checkedOutBookings.length === 0 && !error && <p>{feedback || "No checked-out bookings found for the selected hotel or matching search criteria."}</p>}
            <div className="bookings-list-billing">
                {checkedOutBookings.map(booking => (
                <div key={booking.bookingId} className="booking-item-billing" onClick={() => setSelectedBookingForBill(booking)}>
                    <p><strong>Booking ID:</strong> {booking.bookingId}</p>
                    <p><strong>Client:</strong> {booking.clientName} ({booking.clientEmail})</p>
                    <p><strong>Room:</strong> {booking.roomName}</p>
                    <p><strong>Checked Out:</strong> {booking.checkedOutTime ? new Date(booking.checkedOutTime).toLocaleDateString() : (booking.status === 'Checked-out' ? 'Date N/A' : 'N/A')}</p>
                    <p><strong>Status:</strong> {booking.status}</p>
                </div>
                ))}
            </div>
            </>
        )}

        {selectedBookingForBill && (
          <div className="bill-details-section">
            <h3>Bill for Booking ID: {selectedBookingForBill.bookingId}</h3>
            <button onClick={() => setSelectedBookingForBill(null)} className="back-to-list-btn">Back to List</button>
            <div className="bill-summary">
              <p><strong>Client:</strong> {selectedBookingForBill.clientName} ({selectedBookingForBill.clientEmail})</p>
              <p><strong>Room:</strong> {selectedBookingForBill.roomName} ({selectedBookingForBill.roomType})</p>
              <p><strong>Stay Dates:</strong> {new Date(selectedBookingForBill.startDate).toLocaleDateString()} - {new Date(selectedBookingForBill.endDate).toLocaleDateString()}</p>
              <p><strong>Room Charges:</strong> ${calculateRoomTotal(selectedBookingForBill).toFixed(2)}</p>

              <h4>Consumptions:</h4>
              {selectedBookingForBill.consumptions && selectedBookingForBill.consumptions.length > 0 ? (
                <ul>
                  {selectedBookingForBill.consumptions.map(item => (
                    <li key={item.id}>
                      {item.itemName} (x{item.quantity}) - ${ (item.price * item.quantity).toFixed(2) }
                    </li>
                  ))}
                </ul>
              ) : <p>No consumptions recorded.</p>}
              <p><strong>Total Consumptions:</strong> ${calculateConsumptionsTotal(selectedBookingForBill).toFixed(2)}</p>
              <hr/>
              <p className="grand-total"><strong>Grand Total:</strong> ${(calculateRoomTotal(selectedBookingForBill) + calculateConsumptionsTotal(selectedBookingForBill)).toFixed(2)}</p>
            </div>
            <div className="bill-actions">
              <button onClick={() => handleGeneratePdf(selectedBookingForBill)} className="action-btn pdf-btn">Generate PDF (Mock)</button>
              <button onClick={() => handleSendEmail(selectedBookingForBill)} className="action-btn email-btn">Send Email (Mock)</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default AgentBillingPage;
