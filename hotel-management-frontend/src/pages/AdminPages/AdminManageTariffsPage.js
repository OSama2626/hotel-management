import React, { useState, useEffect, useCallback } from 'react';
import {
    getHotels, getHotelById,
    addSeasonToHotel, updateSeasonInHotel, deleteSeasonFromHotel,
    setTariffForSeason
} from '../../services/roomService';
import './AdminPages.css';

// --- SeasonForm Sub-Component ---
const SeasonForm = ({ hotelId, initialData, onSubmit, onCancel, isEditMode }) => {
  const [seasonData, setSeasonData] = useState({ name: '', startDate: '', endDate: '' });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      setSeasonData({
        name: initialData.name || '',
        startDate: initialData.startDate || '',
        endDate: initialData.endDate || '',
      });
    } else {
      setSeasonData({ name: '', startDate: '', endDate: '' }); // Reset for new
    }
  }, [initialData]);

  const handleChange = (e) => setSeasonData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!seasonData.name || !seasonData.startDate || !seasonData.endDate) {
      setFormError("Season name, start date, and end date are required.");
      return;
    }
    if (new Date(seasonData.endDate) < new Date(seasonData.startDate)) {
        setFormError("End date cannot be before start date.");
        return;
    }
    try {
      await onSubmit(hotelId, seasonData); // Pass hotelId here
    } catch (err) {
      setFormError(err.message || "Submission failed.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content admin-form-modal">
        <h3>{isEditMode ? 'Edit Season' : 'Add New Season'}</h3>
        {formError && <p className="error-message">{formError}</p>}
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label htmlFor="name">Season Name:</label>
            <input type="text" id="name" name="name" value={seasonData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="startDate">Start Date:</label>
            <input type="date" id="startDate" name="startDate" value={seasonData.startDate} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">End Date:</label>
            <input type="date" id="endDate" name="endDate" value={seasonData.endDate} onChange={handleChange} required />
          </div>
          <div className="form-actions">
            <button type="submit">{isEditMode ? 'Update Season' : 'Add Season'}</button>
            <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- TariffForm Sub-Component ---
const TariffForm = ({ hotelId, season, onTariffSet, onCancel }) => {
    const roomTypes = ['Single', 'Double', 'Double Confort', 'Suite']; // Centralize this if used elsewhere
    const [tariffs, setTariffs] = useState({});
    const [formError, setFormError] = useState('');
    const [hotelName, setHotelName] = useState('');

    useEffect(() => {
        if (season && season.tariffs) {
            setTariffs(season.tariffs);
        } else {
            setTariffs({});
        }
        // Fetch hotel name for display
        const fetchHotelName = async () => {
            try {
                const hotel = await getHotelById(hotelId);
                setHotelName(hotel.name);
            } catch (error) {
                console.error("Could not fetch hotel name for tariff form", error);
                setHotelName('Selected Hotel');
            }
        };
        if(hotelId) fetchHotelName();

    }, [season, hotelId]);

    const handleChange = (roomType, value) => {
        setTariffs(prev => ({
            ...prev,
            [roomType]: value === '' ? undefined : parseFloat(value) // Store as number or undefined if empty
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');
        try {
            let changesMade = false;
            for (const roomType of roomTypes) {
                const price = tariffs[roomType];
                // Only update if price is validly entered or if it's being cleared (set to undefined from a previous value)
                if (price !== undefined && price !== null && !isNaN(price)) {
                    if (price < 0) {
                        setFormError(`Price for ${roomType} cannot be negative.`);
                        return;
                    }
                    await setTariffForSeason(hotelId, season.id, roomType, price);
                    changesMade = true;
                } else if (price === undefined && season.tariffs && season.tariffs[roomType] !== undefined) {
                    // If price is cleared (undefined) and there was an old tariff, set to a special value like 0 or handle deletion
                    // For now, we'll set it to 0 to signify removal of specific tariff, falling back to base price.
                    // Or, a dedicated "remove tariff" button would be better.
                    // This mock sets it to 0, effectively removing it from specific seasonal pricing.
                    await setTariffForSeason(hotelId, season.id, roomType, 0); // Set to 0 to "remove" or indicate base price
                    changesMade = true;
                }
            }
            if(changesMade) {
                onTariffSet();
            } else {
                onCancel(); // No changes, just close
            }
        } catch (err) {
            setFormError(err.message || "Failed to set tariffs.");
        }
    };

    if (!season) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content admin-form-modal" style={{maxWidth: '500px'}}>
                <h3>Manage Tariffs for {season.name}</h3>
                <p>Hotel: {hotelName}</p>
                {formError && <p className="error-message">{formError}</p>}
                <form onSubmit={handleSubmit} className="admin-form">
                    {roomTypes.map(type => (
                        <div className="form-group" key={type}>
                            <label htmlFor={`tariff-${type}`}>{type} Room Price:</label>
                            <input
                                type="number"
                                id={`tariff-${type}`}
                                name={type}
                                value={tariffs[type] === undefined ? '' : tariffs[type]}
                                onChange={(e) => handleChange(type, e.target.value)}
                                placeholder="Leave empty for base price"
                                min="0"
                                step="0.01"
                            />
                        </div>
                    ))}
                    <div className="form-actions">
                        <button type="submit">Save Tariffs</button>
                        <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- Main AdminManageTariffsPage Component ---
const AdminManageTariffsPage = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotel, setSelectedHotel] = useState(null); // Store full hotel object
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);

  const [showTariffForm, setShowTariffForm] = useState(false);
  const [managingTariffsForSeason, setManagingTariffsForSeason] = useState(null);

  useEffect(() => {
    const loadHotels = async () => {
      setLoading(true); setError('');
      try {
        const hotelData = await getHotels();
        setHotels(hotelData);
      } catch (err) {
        setError("Failed to load hotels.");
      } finally {
        setLoading(false);
      }
    };
    loadHotels();
  }, []);

  const handleHotelSelect = async (hotelId) => {
    if (!hotelId) {
      setSelectedHotel(null); return;
    }
    setLoading(true); setError(''); setFeedback('');
    try {
      const hotelDetails = await getHotelById(hotelId); // Fetch full details, including seasons
      setSelectedHotel(hotelDetails);
    } catch (err) {
      setError("Failed to load hotel details.");
      setSelectedHotel(null);
    } finally {
      setLoading(false);
    }
  };

  // Season Actions
  const handleAddSeason = () => { setEditingSeason(null); setShowSeasonForm(true); setFeedback(''); };
  const handleEditSeason = (season) => { setEditingSeason(season); setShowSeasonForm(true); setFeedback(''); };
  const handleDeleteSeason = async (seasonId) => {
    if (!selectedHotel || !window.confirm("Delete this season? Tariffs within it will be lost.")) return;
    setFeedback(''); setError('');
    try {
      await deleteSeasonFromHotel(selectedHotel.id, seasonId);
      setFeedback("Season deleted.");
      handleHotelSelect(selectedHotel.id); // Refresh hotel data
    } catch (err) { setError(err.message || "Failed to delete season."); }
  };
  const handleSeasonFormSubmit = async (hotelId, seasonData) => {
    setFeedback(''); setError('');
    try {
      if (editingSeason) {
        await updateSeasonInHotel(hotelId, editingSeason.id, seasonData);
        setFeedback("Season updated.");
      } else {
        await addSeasonToHotel(hotelId, seasonData);
        setFeedback("Season added.");
      }
      setShowSeasonForm(false); setEditingSeason(null);
      handleHotelSelect(hotelId); // Refresh hotel data
    } catch (err) { throw err; } // Re-throw for form to display
  };

  // Tariff Actions
  const handleManageTariffs = (season) => {
    setManagingTariffsForSeason(season);
    setShowTariffForm(true);
    setFeedback('');
  };
  const handleTariffFormSubmit = () => {
    setShowTariffForm(false);
    setManagingTariffsForSeason(null);
    setFeedback("Tariffs saved successfully.");
    if (selectedHotel) handleHotelSelect(selectedHotel.id); // Refresh hotel data
  };


  if (loading && !selectedHotel && hotels.length === 0) return <div className="admin-page"><p>Loading hotel data...</p></div>;

  return (
    <div className="admin-page">
      <header className="admin-header"><h1>Manage Tariffs & Seasons</h1></header>
      <main className="admin-content">
        {error && <p className="error-message">{error}</p>}
        {feedback && <p className="success-message">{feedback}</p>}

        <div className="form-group">
          <label htmlFor="hotelSelect">Select Hotel to Manage Tariffs:</label>
          <select id="hotelSelect" onChange={(e) => handleHotelSelect(e.target.value)} value={selectedHotel?.id || ''}>
            <option value="">-- Select Hotel --</option>
            {hotels.map(h => <option key={h.id} value={h.id}>{h.name} ({h.city})</option>)}
          </select>
        </div>

        {loading && selectedHotel && <p>Loading details for {selectedHotel.name}...</p>}

        {selectedHotel && !loading && (
          <div className="hotel-tariffs-section">
            <h2>Seasons for {selectedHotel.name}</h2>
            <button onClick={handleAddSeason} className="add-new-btn" style={{marginBottom: '15px'}}>Add New Season</button>
            {selectedHotel.seasons && selectedHotel.seasons.length > 0 ? (
              <table className="admin-table">
                <thead><tr><th>Season Name</th><th>Start Date</th><th>End Date</th><th>Tariffs Set</th><th>Actions</th></tr></thead>
                <tbody>
                  {selectedHotel.seasons.map(s => (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{new Date(s.startDate).toLocaleDateString()}</td>
                      <td>{new Date(s.endDate).toLocaleDateString()}</td>
                      <td>{Object.keys(s.tariffs || {}).length > 0 ? Object.entries(s.tariffs).map(([type, price]) => `${type}: ${price}`).join(', ') : 'None'}</td>
                      <td className="actions">
                        <button onClick={() => handleManageTariffs(s)} className="edit-btn">Manage Tariffs</button>
                        <button onClick={() => handleEditSeason(s)} className="edit-btn" style={{marginLeft:'5px'}}>Edit Season</button>
                        <button onClick={() => handleDeleteSeason(s.id)} className="delete-btn" style={{marginLeft:'5px'}}>Delete Season</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p>No seasons defined for this hotel yet.</p>}
          </div>
        )}

        {showSeasonForm && selectedHotel && (
          <SeasonForm
            hotelId={selectedHotel.id}
            initialData={editingSeason}
            onSubmit={handleSeasonFormSubmit}
            onCancel={() => { setShowSeasonForm(false); setEditingSeason(null); }}
            isEditMode={!!editingSeason}
          />
        )}

        {showTariffForm && selectedHotel && managingTariffsForSeason && (
            <TariffForm
                hotelId={selectedHotel.id}
                season={managingTariffsForSeason}
                onTariffSet={handleTariffFormSubmit}
                onCancel={() => { setShowTariffForm(false); setManagingTariffsForSeason(null);}}
            />
        )}

      </main>
    </div>
  );
};
export default AdminManageTariffsPage;
