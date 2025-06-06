// hotel-management-frontend/src/pages/RoomListPage/RoomListPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Add this import
import './RoomListPage.css';
import { getAvailableRooms, getHotels } from '../../services/roomService';

const RoomListPage = () => {
  const navigate = useNavigate(); // Initialize navigate
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  // ... (rest of the state variables: loading, error, filters, roomTypes)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    roomType: '',
    hotelId: ''
  });
  const roomTypes = ['Single', 'Double', 'Double Confort', 'Suite'];


  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        const hotelData = await getHotels();
        setHotels(hotelData);
      } catch (err) {
        console.error("Error fetching hotels:", err);
      }
    };
    fetchHotelData();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      setError('');
      try {
        console.log("Fetching rooms with filters:", filters);
        const fetchedRooms = await getAvailableRooms(filters);
        setRooms(fetchedRooms);
      } catch (err)
      {
        console.error("Error fetching rooms:", err);
        setError('Failed to fetch rooms. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value
    }));
  };

  // Updated handleBooking function
  const handleBooking = (roomId) => {
    navigate(`/book/${roomId}`, {
      state: {
        startDate: filters.startDate,
        endDate: filters.endDate
      }
    });
  };

  if (loading && rooms.length === 0) {
    return <div className="room-list-page">Loading rooms...</div>;
  }

  return (
    <div className="room-list-page">
      <h2>Available Rooms</h2>
      <div className="filters-container">
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleFilterChange}
        />
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleFilterChange}
        />
        <select name="roomType" value={filters.roomType} onChange={handleFilterChange}>
          <option value="">All Room Types</option>
          {roomTypes.map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select name="hotelId" value={filters.hotelId} onChange={handleFilterChange}>
          <option value="">All Hotels</option>
          {hotels.map(hotel => <option key={hotel.id} value={hotel.id}>{hotel.name} - {hotel.city}</option>)}
        </select>
      </div>

      {error && <p className="error-message">{error}</p>}
      {loading && <p>Loading filtered results...</p>}

      <div className="room-list">
        {!loading && rooms.length > 0 ? rooms.map(room => (
          <div key={room.id} className="room-card">
            <h3>{room.name}</h3>
            {/* Ensure hotel name is displayed correctly */}
            <p>Hotel: {hotels.find(h => h.id === room.hotelId)?.name || room.location || 'N/A'}</p>
            <p>Type: {room.type}</p>
            <p>Price: ${room.price}/night</p>
            <p>Status: {room.availability}</p>
            {room.amenities && room.amenities.length > 0 && (
              <p>Amenities: {room.amenities.join(', ')}</p>
            )}
            {room.availability !== 'Booked' && (
              <button onClick={() => handleBooking(room.id)}>Book Now</button>
            )}
          </div>
        )) : (!loading && <p>No rooms available matching your criteria.</p>)}
      </div>
    </div>
  );
};

export default RoomListPage;
