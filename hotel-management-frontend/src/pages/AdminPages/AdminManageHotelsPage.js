import React, { useState, useEffect, useCallback } from 'react';
import { getHotels, addHotel, updateHotel, deleteHotel, getHotelById } from '../../services/roomService';
import './AdminPages.css'; // Shared admin styles

const HotelForm = ({ initialData, onSubmit, onCancel, isEditMode }) => {
  const [hotelData, setHotelData] = useState({
    code: '', name: '', address: '', city: '', stars: 3, // Default to 3 stars
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      setHotelData({
        code: initialData.code || '',
        name: initialData.name || '',
        address: initialData.address || '',
        city: initialData.city || '',
        stars: initialData.stars || 3,
      });
    } else {
      // Reset for new form
      setHotelData({ code: '', name: '', address: '', city: '', stars: 3 });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setHotelData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value, 10) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!hotelData.name || !hotelData.city || !hotelData.code || !hotelData.address || hotelData.stars < 1 || hotelData.stars > 5) {
      setFormError("Please fill in all fields correctly. Stars must be between 1 and 5.");
      return;
    }
    try {
      await onSubmit(hotelData);
    } catch (err) {
      setFormError(err.message || "Submission failed.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content admin-form-modal">
        <h3>{isEditMode ? 'Edit Hotel' : 'Add New Hotel'}</h3>
        {formError && <p className="error-message">{formError}</p>}
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="code">Hotel Code (Unique):</label>
            <input type="text" id="code" name="code" value={hotelData.code} onChange={handleChange} required disabled={isEditMode} />
          </div>
          <div className="form-group">
            <label htmlFor="name">Hotel Name:</label>
            <input type="text" id="name" name="name" value={hotelData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="address">Address:</label>
            <input type="text" id="address" name="address" value={hotelData.address} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="city">City:</label>
            <input type="text" id="city" name="city" value={hotelData.city} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="stars">Star Rating (1-5):</label>
            <input type="number" id="stars" name="stars" value={hotelData.stars} onChange={handleChange} required min="1" max="5" />
          </div>
          <div className="form-actions">
            <button type="submit">{isEditMode ? 'Update Hotel' : 'Add Hotel'}</button>
            <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const AdminManageHotelsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null); // null for new, hotel object for edit

  const fetchHotels = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const hotelData = await getHotels();
      setHotels(hotelData);
    } catch (err) {
      setError("Failed to fetch hotels.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHotels();
  }, [fetchHotels]);

  const handleAddHotel = () => {
    setEditingHotel(null); // Ensure it's a new hotel form
    setShowForm(true);
    setFeedback(''); setError('');
  };

  const handleEditHotel = async (hotelId) => {
    setFeedback(''); setError('');
    try {
        const hotelToEdit = await getHotelById(hotelId); // Fetch latest data
        setEditingHotel(hotelToEdit);
        setShowForm(true);
    } catch (err) {
        setError(err.message || "Could not load hotel data for editing.");
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    setFeedback(''); setError('');
    if (!window.confirm("Are you sure you want to delete this hotel? This action cannot be undone.")) return;
    try {
      await deleteHotel(hotelId);
      setFeedback("Hotel deleted successfully.");
      fetchHotels(); // Refresh list
    } catch (err) {
      setError(err.message || "Failed to delete hotel.");
    }
  };

  const handleFormSubmit = async (hotelData) => {
    setFeedback(''); setError('');
    try {
      if (editingHotel && editingHotel.id) { // Editing existing hotel
        await updateHotel(editingHotel.id, hotelData);
        setFeedback("Hotel updated successfully.");
      } else { // Adding new hotel
        await addHotel(hotelData);
        setFeedback("Hotel added successfully.");
      }
      setShowForm(false);
      setEditingHotel(null);
      fetchHotels(); // Refresh list
    } catch (err) {
      // Error will be caught by HotelForm's submit handler and displayed in the form.
      // If we want to show it here too:
      // setError(err.message || "Failed to save hotel data.");
      console.error("Form submission error:", err);
      // Re-throw for the form to catch it if needed, or let form handle its own errors
      throw err;
    }
  };

  if (loading) return <div className="admin-page"><p>Loading hotels...</p></div>;
  // Error is displayed below, so not returning early for it unless critical

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Manage Hotels</h1>
      </header>
      <main className="admin-content">
        {error && <p className="error-message">{error}</p>}
        {feedback && <p className="success-message">{feedback}</p>}

        <button onClick={handleAddHotel} className="add-new-btn" style={{marginBottom: '20px'}}>Add New Hotel</button>

        {showForm && (
          <HotelForm
            initialData={editingHotel}
            onSubmit={handleFormSubmit}
            onCancel={() => { setShowForm(false); setEditingHotel(null); }}
            isEditMode={!!editingHotel}
          />
        )}

        <h3>Existing Hotels</h3>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>City</th>
              <th>Address</th>
              <th>Stars</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hotels.map(hotel => (
              <tr key={hotel.id}>
                <td>{hotel.code}</td>
                <td>{hotel.name}</td>
                <td>{hotel.city}</td>
                <td>{hotel.address}</td>
                <td>{hotel.stars} ★</td>
                <td className="actions">
                  <button onClick={() => handleEditHotel(hotel.id)} className="edit-btn">Edit</button>
                  <button onClick={() => handleDeleteHotel(hotel.id)} className="delete-btn">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {hotels.length === 0 && !loading && <p>No hotels found. Add one to get started!</p>}
      </main>
    </div>
  );
};
export default AdminManageHotelsPage;
