import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAvailableRooms, getHotels, bookService } from '../../services/roomService';
import { searchUsers } from '../../services/authService'; // Import searchUsers
import './AgentPages.css';

const AgentCreateBookingPage = () => {
  const navigate = useNavigate();
  const location = useLocation(); // To get newly created client ID

  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [filters, setFilters] = useState({ startDate: '', endDate: '', roomType: '', hotelId: '' });
  const roomTypes = ['Single', 'Double', 'Double Confort', 'Suite'];

  const [selectedRoom, setSelectedRoom] = useState(null);

  // Client search states
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [foundClients, setFoundClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');

  const [bookingDates, setBookingDates] = useState({ startDate: '', endDate: '' });

  // Pre-fill client if navigated from client creation
  useEffect(() => {
    if (location.state && location.state.newlyCreatedClientId) {
      setSelectedClientId(location.state.newlyCreatedClientId);
      // Optionally, fetch all users once to populate dropdown if navigating back with a new client
      // Or set clientSearchTerm to the new client's name/email to auto-search them.
      if (location.state.newlyCreatedClientName) {
        setClientSearchTerm(location.state.newlyCreatedClientName); // Trigger search for this client
      }
    }
  }, [location.state]);

  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        const hotelData = await getHotels();
        setHotels(hotelData);
      } catch (err) { console.error("Error fetching hotels:", err); }
    };
    fetchHotelData();
  }, []);

  // Debounced client search
  const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const performClientSearch = useCallback(
    debounce(async (term) => {
      if (!term.trim() && !location.state?.newlyCreatedClientId) { // Don't clear if a client was just created and passed
        setFoundClients([]);
        return;
      }
      setSearchLoading(true);
      try {
        const clients = await searchUsers(term);
        setFoundClients(clients);
      } catch (err) {
        console.error("Error searching clients:", err);
        setError("Failed to search clients.");
      }
      setSearchLoading(false);
    }, 500),
    [location.state?.newlyCreatedClientId]
  );

  useEffect(() => {
    performClientSearch(clientSearchTerm);
  }, [clientSearchTerm, performClientSearch]);


  const handleSearchRooms = async () => {
    if (!filters.hotelId) {
        setError("Please select a hotel to search for rooms.");
        return;
    }
    setLoading(true); setError(''); setSuccess(''); setSelectedRoom(null); setRooms([]);
    try {
      const fetchedRooms = await getAvailableRooms(filters);
      setRooms(fetchedRooms);
      if (fetchedRooms.length === 0) setError("No rooms found for the selected criteria.");
    } catch (err) {
      setError(err.message || "Failed to fetch rooms.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleDateChange = (e) => setBookingDates(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const handleClientSearchChange = (e) => {
    setClientSearchTerm(e.target.value);
    setSelectedClientId(''); // Clear selected client when search term changes
  };

  const handleFinalizeBooking = async () => {
    if (!selectedRoom || !selectedClientId || !bookingDates.startDate || !bookingDates.endDate) {
      setError("Please select a room, a client, and booking dates.");
      return;
    }
    setLoading(true); setError(''); setSuccess('');
    try {
      const clientName = foundClients.find(c => c.id === selectedClientId)?.name || 'Client';
      const bookingResponse = await bookService.createBooking(selectedRoom.id, selectedClientId, bookingDates.startDate, bookingDates.endDate);
      setSuccess(`Booking successful for ${clientName}! Booking ID: ${bookingResponse.bookingId}`);
      // Reset form state
      setSelectedRoom(null); setRooms([]); setClientSearchTerm(''); setFoundClients([]); setSelectedClientId('');
      setFilters({ startDate: '', endDate: '', roomType: '', hotelId: filters.hotelId }); // Keep hotel
      setBookingDates({ startDate: '', endDate: '' });

    } catch (err) {
      setError(err.message || "Failed to create booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agent-page">
      <h2>Create Booking for Client</h2>
      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}

      <div className="form-section">
        <h3>1. Search Available Rooms</h3>
        <select name="hotelId" value={filters.hotelId} onChange={handleFilterChange} required>
          <option value="">Select Hotel</option>
          {hotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.name}</option>)}
        </select>
        <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} placeholder="Start Date" />
        <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} placeholder="End Date" />
        <select name="roomType" value={filters.roomType} onChange={handleFilterChange}>
          <option value="">Any Room Type</option>
          {roomTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <button onClick={handleSearchRooms} disabled={loading || !filters.hotelId}>Search Rooms</button>
      </div>

      {loading && !searchLoading && <p>Searching rooms...</p>}

      {rooms.length > 0 && !selectedRoom && (
        <div className="form-section">
          <h3>2. Select a Room</h3>
          <div className="room-selection-list">
            {rooms.map(room => (
              <div key={room.id} className="room-item" onClick={() => {
                setSelectedRoom(room);
                // Pre-fill booking dates from room search if available and sensible
                if(filters.startDate && filters.endDate) {
                    setBookingDates({startDate: filters.startDate, endDate: filters.endDate});
                }
              }}>
                <h4>{room.name} ({room.type})</h4>
                <p>Price: ${room.price}/night</p>
                <p>Hotel: {hotels.find(h => h.id === room.hotelId)?.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedRoom && (
        <div className="form-section">
          <h3>3. Client and Dates for "{selectedRoom.name}"</h3>
          <p>Price: ${selectedRoom.price}/night</p>

          <div className="form-group">
            <label htmlFor="clientSearch">Search Client (Name/Email):</label>
            <input
              type="text"
              id="clientSearch"
              value={clientSearchTerm}
              onChange={handleClientSearchChange}
              placeholder="Start typing to search..."
            />
            {searchLoading && <p>Searching clients...</p>}
          </div>

          {foundClients.length > 0 && (
            <div className="form-group">
              <label htmlFor="client">Select Client:</label>
              <select id="client" value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} required>
                <option value="">Select from search results</option>
                {foundClients.map(client => <option key={client.id} value={client.id}>{client.name} ({client.email})</option>)}
              </select>
            </div>
          )}
          {clientSearchTerm && !searchLoading && foundClients.length === 0 && (
            <p>No clients found matching "{clientSearchTerm}".</p>
          )}
          <button onClick={() => navigate('/agent/create-client')} className="secondary-action-btn">Register New Client</button>
          <hr />
          <label htmlFor="bookingStartDate">Start Date:</label>
          <input type="date" id="bookingStartDate" name="startDate" value={bookingDates.startDate} onChange={handleDateChange} required/>
          <label htmlFor="bookingEndDate">End Date:</label>
          <input type="date" id="bookingEndDate" name="endDate" value={bookingDates.endDate} onChange={handleDateChange} required/>

          <button onClick={handleFinalizeBooking} disabled={loading || !selectedClientId}>Finalize Booking</button>
          <button onClick={() => {setSelectedRoom(null); setBookingDates({startDate:'', endDate:''});}} disabled={loading} className="cancel-btn">Change Room</button>
        </div>
      )}
    </div>
  );
};
export default AgentCreateBookingPage;
