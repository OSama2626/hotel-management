// Mock data
let mockRoomDatabase = [
  {
    id: '1', hotelId: 'H1', name: 'Cozy Single Room', type: 'Single', location: 'Downtown Hotel', price: 100,
    availability: 'Available', amenities: ['Wi-Fi', 'TV', 'Air Conditioning'],
    bookings: [
      { bookingId: 'B001', roomId: '1', userId: 'user1', hotelId: 'H1', startDate: '2024-03-01', endDate: '2024-03-03', bookedAt: '2024-02-15T10:00:00Z', status: 'Checked-out', validationStatus: 'Approved', validatedByAdminId: 'admin0', validationReason: null, agentId: 'agent1', consumptions: [{ itemName: 'Water', price: 2, quantity: 1}], bookedPricePerNight: 100 },
      { bookingId: 'B002', roomId: '1', userId: 'user2', hotelId: 'H1', startDate: '2024-08-10', endDate: '2024-08-12', bookedAt: '2024-07-01T11:00:00Z', status: 'Pending Admin Approval', validationStatus: 'Pending', validatedByAdminId: null, validationReason: null, agentId: null, consumptions: [], bookedPricePerNight: 120 } // Summer high price
    ]
  },
  {
    id: '2', hotelId: 'H1', name: 'Spacious Double Room', type: 'Double', location: 'Downtown Hotel', price: 150,
    availability: 'Available', amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Balcony'],
    bookings: [
      { bookingId: 'B003', roomId: '2', userId: 'user3', hotelId: 'H1', startDate: '2024-09-05', endDate: '2024-09-07', bookedAt: '2024-08-20T14:00:00Z', status: 'Checked-in', validationStatus: 'Approved', validatedByAdminId: 'admin0', validationReason: null, agentId: 'agent1', consumptions: [{ itemName: 'Snack Bar', price: 15, quantity: 1}], bookedPricePerNight: 150 } // Assuming base price
    ]
  },
  {
    id: '3', hotelId: 'H2', name: 'Luxury Suite', type: 'Suite', location: 'Sea View Resort', price: 300,
    availability: 'Available', amenities: ['Wi-Fi', 'Large TV', 'Air Conditioning', 'Jacuzzi', 'Mini Bar'],
    bookings: [
        { bookingId: 'B004', roomId: '3', userId: 'user4', hotelId: 'H2', startDate: '2024-10-15', endDate: '2024-10-18', bookedAt: '2024-09-01T16:00:00Z', status: 'Pending Admin Approval', validationStatus: 'Pending', validatedByAdminId: null, validationReason: null, agentId: null, consumptions: [], bookedPricePerNight: 300 } // Base price, H2 Peak season is Jul-Sep
    ]
  },
  { id: '4', hotelId: 'H2', name: 'Comfort Double Room', type: 'Double Confort', location: 'Sea View Resort', price: 180, availability: 'Available', amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Desk'], bookings: [] },
  { id: '5', hotelId: 'H3', name: 'Basic Single', type: 'Single', location: 'Airport Wing Hotel', price: 80, availability: 'Available', amenities: ['Wi-Fi', 'TV'], bookings: [] },
  { id: '6', hotelId: 'H1', name: 'Another Suite', type: 'Suite', location: 'Downtown Hotel', price: 280, availability: 'Available', amenities: ['Wi-Fi', 'TV', 'Jacuzzi'], bookings: [] },
];

let mockHotels = [
  {
    id: 'H1', code: 'DTHTL', name: 'Downtown Hotel', address: '123 Main St', city: 'Metropolis', stars: 4,
    seasons: [
      { id: 'S1H1', name: 'Summer High', startDate: '2024-06-01', endDate: '2024-08-31', tariffs: { 'Single': 120, 'Double': 180, 'Suite': 350 } },
      { id: 'S2H1', name: 'Winter Low', startDate: '2024-12-01', endDate: '2025-02-28', tariffs: { 'Single': 90, 'Double': 140, 'Suite': 280 } }
    ]
  },
  {
    id: 'H2', code: 'SVRST', name: 'Sea View Resort', address: '456 Ocean Ave', city: 'Bayview', stars: 5,
    seasons: [
        { id: 'S1H2', name: 'Peak Season', startDate: '2024-07-01', endDate: '2024-09-30', tariffs: { 'Suite': 320, 'Double Confort': 200 } }
    ]
  },
  { id: 'H3', code: 'APWHT', name: 'Airport Wing Hotel', address: '789 Runway Rd', city: 'Airtown', stars: 3, seasons: [] },
];

let mockAuthUsers = [];
export const syncAuthUsers = (usersFromAuthService) => { mockAuthUsers = usersFromAuthService; };

export const getHotels = async () => Promise.resolve(mockHotels.map(h => ({...h, seasons: (h.seasons || []).map(s => ({...s, tariffs: {...(s.tariffs || {})}})) })));
export const getHotelById = async (hotelId) => {
  return new Promise((resolve, reject) => {
    const hotel = mockHotels.find(h => h.id === hotelId);
    if (hotel) resolve({...hotel, seasons: (hotel.seasons || []).map(s => ({...s, tariffs: {...(s.tariffs || {})}}))});
    else reject({ message: "Hotel not found." });
  });
};
export const addHotel = async (hotelData) => { return new Promise((resolve, reject) => setTimeout(() => { if (!hotelData.name || !hotelData.city || !hotelData.code || !hotelData.address || !hotelData.stars) { return reject({ message: "Hotel name, code, address, city, and stars are required." }); } if (mockHotels.find(h => h.code === hotelData.code)) { return reject({ message: "Hotel code must be unique." }); } const newHotel = {  id: \`H\${Date.now()}\`,  ...hotelData, seasons: hotelData.seasons || [] }; mockHotels.push(newHotel); resolve({ hotel: {...newHotel, seasons: (newHotel.seasons || []).map(s => ({...s, tariffs: {...(s.tariffs || {})}})) }, message: "Hotel added successfully." }); }, 100)); };
export const updateHotel = async (hotelId, updatedData) => { return new Promise((resolve, reject) => setTimeout(() => { const hotelIndex = mockHotels.findIndex(h => h.id === hotelId); if (hotelIndex === -1) { return reject({ message: "Hotel not found for update." }); } if (!updatedData.name || !updatedData.city || !updatedData.code || !updatedData.address || !updatedData.stars) { return reject({ message: "Hotel name, code, address, city, and stars are required." }); } if (updatedData.code !== mockHotels[hotelIndex].code && mockHotels.find(h => h.code === updatedData.code && h.id !== hotelId)) { return reject({ message: "Hotel code must be unique." }); } const seasons = updatedData.seasons !== undefined ? updatedData.seasons : mockHotels[hotelIndex].seasons; mockHotels[hotelIndex] = { ...mockHotels[hotelIndex], ...updatedData, seasons: seasons }; resolve({ hotel: {...mockHotels[hotelIndex], seasons: (mockHotels[hotelIndex].seasons || []).map(s => ({...s, tariffs: {...(s.tariffs || {})}})) }, message: "Hotel updated successfully." }); }, 100)); };
export const deleteHotel = async (hotelId) => { return new Promise((resolve, reject) => setTimeout(() => { const hotelIndex = mockHotels.findIndex(h => h.id === hotelId); if (hotelIndex > -1) { if (mockRoomDatabase.some(room => room.hotelId === hotelId)) console.warn(\`Deleting hotel \${hotelId} with rooms.\`); mockHotels.splice(hotelIndex, 1); resolve({ message: "Hotel deleted successfully." }); } else { reject({ message: "Hotel not found for deletion during splice." }); } }, 100)); };
export const addSeasonToHotel = async (hotelId, seasonData) => { return new Promise((resolve, reject) => setTimeout(() => { const hotelIndex = mockHotels.findIndex(h => h.id === hotelId); if (hotelIndex === -1) return reject({ message: "Hotel not found." }); if (!seasonData.name || !seasonData.startDate || !seasonData.endDate) { return reject({ message: "Season name, start date, and end date are required."}); } if (new Date(seasonData.endDate) < new Date(seasonData.startDate)) { return reject({ message: "End date cannot be before start date for a season."}); } const newSeason = { id: \`S\${Date.now()}\`, name: seasonData.name, startDate: seasonData.startDate, endDate: seasonData.endDate, tariffs: seasonData.tariffs || {} }; if (!mockHotels[hotelIndex].seasons) mockHotels[hotelIndex].seasons = []; mockHotels[hotelIndex].seasons.push(newSeason); resolve({ season: {...newSeason, tariffs: {...newSeason.tariffs}}, message: "Season added successfully." }); }, 100)); };
export const updateSeasonInHotel = async (hotelId, seasonId, updatedSeasonData) => { return new Promise((resolve, reject) => setTimeout(() => { const hotelIndex = mockHotels.findIndex(h => h.id === hotelId); if (hotelIndex === -1) return reject({ message: "Hotel not found."}); const seasonIndex = mockHotels[hotelIndex].seasons?.findIndex(s => s.id === seasonId); if (seasonIndex === undefined || seasonIndex === -1) return reject({ message: "Season not found."}); if (!updatedSeasonData.name || !updatedSeasonData.startDate || !updatedSeasonData.endDate) { return reject({ message: "Season name, start date, and end date are required."}); } if (new Date(updatedSeasonData.endDate) < new Date(updatedSeasonData.startDate)) { return reject({ message: "End date cannot be before start date."}); } mockHotels[hotelIndex].seasons[seasonIndex] = { ...mockHotels[hotelIndex].seasons[seasonIndex], ...updatedSeasonData, tariffs: updatedSeasonData.tariffs || mockHotels[hotelIndex].seasons[seasonIndex].tariffs || {} }; const updatedSeason = mockHotels[hotelIndex].seasons[seasonIndex]; resolve({ season: {...updatedSeason, tariffs: {...updatedSeason.tariffs}}, message: "Season updated successfully." }); }, 100)); };
export const deleteSeasonFromHotel = async (hotelId, seasonId) => { return new Promise((resolve, reject) => setTimeout(() => { const hotelIndex = mockHotels.findIndex(h => h.id === hotelId); if (hotelIndex === -1) return reject({ message: "Hotel not found."}); if (!mockHotels[hotelIndex].seasons) return reject({ message: "No seasons for hotel."}); const initialLength = mockHotels[hotelIndex].seasons.length; mockHotels[hotelIndex].seasons = mockHotels[hotelIndex].seasons.filter(s => s.id !== seasonId); if (mockHotels[hotelIndex].seasons.length === initialLength) return reject({ message: "Season not found for deletion."}); resolve({ message: "Season deleted successfully." }); }, 100)); };
export const setTariffForSeason = async (hotelId, seasonId, roomType, price) => { return new Promise((resolve, reject) => setTimeout(() => { const hotelIndex = mockHotels.findIndex(h => h.id === hotelId); if (hotelIndex === -1) return reject({ message: "Hotel not found."}); const seasonIndex = mockHotels[hotelIndex].seasons?.findIndex(s => s.id === seasonId); if (seasonIndex === undefined || seasonIndex === -1) return reject({ message: "Season not found."}); if (!roomType || price === undefined || price < 0) { return reject({ message: "Room type and valid price required."}); } if (!mockHotels[hotelIndex].seasons[seasonIndex].tariffs) mockHotels[hotelIndex].seasons[seasonIndex].tariffs = {}; mockHotels[hotelIndex].seasons[seasonIndex].tariffs[roomType] = parseFloat(price); resolve({ tariffs: {...mockHotels[hotelIndex].seasons[seasonIndex].tariffs}, message: \`Tariff for \${roomType} set to \${price}.\` }); }, 100)); };

function getPriceForRoomType(room, targetDate = new Date()) {
    const hotel = mockHotels.find(h => h.id === room.hotelId);
    if (hotel && hotel.seasons) {
        const currentTargetDate = new Date(targetDate);
        currentTargetDate.setHours(0,0,0,0);
        for (const season of hotel.seasons) {
            const startDate = new Date(season.startDate);
            const endDate = new Date(season.endDate);
            startDate.setHours(0,0,0,0);
            endDate.setHours(0,0,0,0);
            if (currentTargetDate >= startDate && currentTargetDate <= endDate) {
                if (season.tariffs && season.tariffs[room.type] !== undefined) {
                    return season.tariffs[room.type];
                }
            }
        }
    }
    return room.price;
}

export const getRoomById = async (id, dateForPricing = new Date()) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const roomData = mockRoomDatabase.find(r => r.id === id);
      if (roomData) {
        const roomCopy = {...roomData};
        const dynamicPrice = getPriceForRoomType(roomCopy, dateForPricing);
        resolve({ ...roomCopy, price: dynamicPrice, bookings: (roomCopy.bookings || []).map(b => ({...b})) });
      } else {
        reject({ message: "Room not found" });
      }
    }, 100);
  });
};

export const getAvailableRooms = async (filters = {}) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredRooms = mockRoomDatabase.map(r => ({...r}));
      if (filters.hotelId) {
        filteredRooms = filteredRooms.filter(room => room.hotelId === filters.hotelId);
      }
      if (filters.roomType) {
        filteredRooms = filteredRooms.filter(room => room.type === filters.roomType);
      }
      const pricingDate = filters.startDate ? new Date(filters.startDate) : new Date();
      filteredRooms.forEach(room => {
        room.price = getPriceForRoomType(room, pricingDate);
      });
      if (filters.startDate && filters.endDate) {
        const newStart = new Date(filters.startDate);
        const newEnd = new Date(filters.endDate);
        filteredRooms = filteredRooms.filter(room => {
          const isRoomBookedForDates = room.bookings.some(booking => {
            if (booking.status === 'Cancelled' || booking.status === 'Rejected') return false;
            const existingStart = new Date(booking.startDate);
            const existingEnd = new Date(booking.endDate);
            return newStart < existingEnd && newEnd > existingStart;
          });
          return !isRoomBookedForDates;
        });
      }
      resolve(filteredRooms.map(r => ({...r, bookings: []})));
    }, 100);
  });
};

export const bookService = {
  createBooking: async (roomId, userId, startDate, endDate, createdByRole = 'client') => {
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        const roomIndex = mockRoomDatabase.findIndex(r => r.id === roomId);
        if (roomIndex === -1) return reject({ message: "Room not found for booking." });

        const room = mockRoomDatabase[roomIndex];
        const newStart = new Date(startDate);
        const newEnd = new Date(endDate);

        const isConflict = room.bookings.some(booking => {
            if (booking.status === 'Cancelled' || booking.status === 'Rejected') return false;
            const existingStart = new Date(booking.startDate);
            const existingEnd = new Date(booking.endDate);
            return newStart < existingEnd && newEnd > existingStart;
        });
        if (isConflict) return reject({ message: "Selected dates conflict with an existing booking." });

        const bookedPrice = await getPriceForRoomType(room, newStart);

        const newBooking = {
          bookingId: \`B\${Date.now()}\`, roomId, userId, hotelId: room.hotelId, startDate, endDate,
          bookedAt: new Date().toISOString(),
          status: createdByRole === 'agent' || createdByRole === 'admin' ? 'Confirmed' : 'Pending Admin Approval',
          validationStatus: createdByRole === 'agent' || createdByRole === 'admin' ? 'Approved' : 'Pending',
          validatedByAdminId: createdByRole === 'agent' || createdByRole === 'admin' ? \`auto-approved-\${createdByRole}\` : null,
          validationReason: null,
          agentId: createdByRole === 'agent' ? userId : null,
          consumptions: [],
          bookedPricePerNight: bookedPrice
        };
        mockRoomDatabase[roomIndex].bookings.push(newBooking);
        resolve({ ...newBooking, roomName: room.name, roomLocation: room.location });
      }, 100);
    });
  },
  getUserBookings: async (userId) => { return new Promise((resolve) => setTimeout(() => { const userBookings = []; mockRoomDatabase.forEach(room => { room.bookings.forEach(booking => { if (booking.userId === userId) { const client = mockAuthUsers.find(u => u.id === booking.userId); userBookings.push({ ...booking, roomName: room.name, roomLocation: room.location, roomPrice: booking.bookedPricePerNight !== undefined ? booking.bookedPricePerNight : room.price, clientName: client?.name || 'N/A', clientEmail: client?.email || 'N/A' }); } }); }); resolve(userBookings.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt))); }, 100)); },
  cancelBooking: async (bookingId, userIdPerformingCancel, rolePerformingCancel = 'client') => { return new Promise((resolve, reject) => setTimeout(() => { for (const room of mockRoomDatabase) { const bookingIndex = room.bookings.findIndex(b => b.bookingId === bookingId); if (bookingIndex !== -1) { if (room.bookings[bookingIndex].userId !== userIdPerformingCancel && rolePerformingCancel === 'client') return reject({ message: "Client can only cancel their own bookings."}); if (room.bookings[bookingIndex].status === 'Cancelled' || room.bookings[bookingIndex].status === 'Rejected') return reject({ message: 'This booking is already cancelled/rejected.' }); room.bookings[bookingIndex].status = 'Cancelled'; room.bookings[bookingIndex].validationStatus = 'N/A'; return resolve({ message: 'Booking cancelled successfully.', booking: {...room.bookings[bookingIndex]} }); } } reject({ message: 'Booking not found.' }); }, 100)); },
  getBookingsForHotel: async (hotelId, filters = {}) => { return new Promise((resolve) => setTimeout(() => { let hotelBookings = []; mockRoomDatabase.forEach(room => { if (room.hotelId === hotelId) { room.bookings.forEach(booking => { const client = mockAuthUsers.find(u => u.id === booking.userId); hotelBookings.push({ ...booking, roomName: room.name, roomType: room.type, roomPrice: booking.bookedPricePerNight !== undefined ? booking.bookedPricePerNight : room.price, clientName: client?.name || 'N/A', clientEmail: client?.email || 'N/A' }); }); } }); if (filters.status) { hotelBookings = hotelBookings.filter(b => b.status === filters.status); } if (filters.validationStatus) { hotelBookings = hotelBookings.filter(b => b.validationStatus === filters.validationStatus); } if (filters.date) { const fDate = new Date(filters.date); fDate.setHours(0,0,0,0); hotelBookings = hotelBookings.filter(b => { const sDate = new Date(b.startDate); sDate.setHours(0,0,0,0); const eDate = new Date(b.endDate); eDate.setHours(0,0,0,0); return sDate <= fDate && fDate < eDate; }); } if (filters.searchTerm) { const term = filters.searchTerm.toLowerCase(); hotelBookings = hotelBookings.filter(b => b.clientName?.toLowerCase().includes(term) || b.clientEmail?.toLowerCase().includes(term) || b.bookingId?.toLowerCase().includes(term) || b.roomName?.toLowerCase().includes(term)); } resolve(hotelBookings.sort((a, b) => new Date(a.startDate) - new Date(b.startDate))); }, 100)); },
  updateBookingStatus: async (bookingId, newStatus, agentIdPerformingAction) => { return new Promise((resolve, reject) => setTimeout(() => { for (const room of mockRoomDatabase) { const bookingIndex = room.bookings.findIndex(b => b.bookingId === bookingId); if (bookingIndex !== -1) { const booking = room.bookings[bookingIndex]; if (booking.status === 'Cancelled' && newStatus !== 'Cancelled') return reject({ message: 'Cannot change status of a cancelled booking.' }); if ((booking.status === 'Checked-out' || booking.status === 'No-show') && (newStatus !== 'Checked-out' && newStatus !== 'No-show')) return reject({ message: \`Cannot change status from \${booking.status} to \${newStatus}.\`}); booking.status = newStatus; if (agentIdPerformingAction) booking.agentId = agentIdPerformingAction; if (newStatus === 'Checked-in') booking.checkedInTime = new Date().toISOString(); if (newStatus === 'Checked-out') booking.checkedOutTime = new Date().toISOString(); return resolve({ message: \`Booking \${bookingId} status updated to \${newStatus}.\`, booking: {...booking} }); } } reject({ message: \`Booking \${bookingId} not found.\` }); }, 100)); },
  addConsumptionToBooking: async (bookingId, consumptionItem) => { return new Promise((resolve, reject) => setTimeout(() => { for (const room of mockRoomDatabase) { const bookingIndex = room.bookings.findIndex(b => b.bookingId === bookingId); if (bookingIndex !== -1) { if (room.bookings[bookingIndex].status !== 'Checked-in') return reject({ message: 'Consumptions can only be added to Checked-in bookings.' }); const newItem = { ...consumptionItem, id: \`cons-\${Date.now()}\`, addedAt: new Date().toISOString() }; if(!room.bookings[bookingIndex].consumptions) room.bookings[bookingIndex].consumptions = []; room.bookings[bookingIndex].consumptions.push(newItem); return resolve({ message: 'Consumption added successfully.', booking: {...room.bookings[bookingIndex]} }); } } reject({ message: \`Booking \${bookingId} not found.\` }); }, 100)); },

  adminApproveBooking: async (bookingId, adminId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        for (const room of mockRoomDatabase) {
          const bookingIndex = room.bookings.findIndex(b => b.bookingId === bookingId);
          if (bookingIndex !== -1) {
            const booking = room.bookings[bookingIndex];
            if (booking.validationStatus !== 'Pending') {
              return reject({ message: \`Booking is already \${booking.validationStatus.toLowerCase()}.\` });
            }
            booking.validationStatus = 'Approved';
            booking.status = 'Confirmed';
            booking.validatedByAdminId = adminId;
            booking.validationReason = null;
            return resolve({ message: 'Booking approved successfully.', booking: {...booking} });
          }
        }
        reject({ message: 'Booking not found for approval.' });
      }, 200);
    });
  },

  adminRejectBooking: async (bookingId, adminId, reason) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        for (const room of mockRoomDatabase) {
          const bookingIndex = room.bookings.findIndex(b => b.bookingId === bookingId);
          if (bookingIndex !== -1) {
            const booking = room.bookings[bookingIndex];
            if (booking.validationStatus !== 'Pending') {
              return reject({ message: \`Booking is already \${booking.validationStatus.toLowerCase()}.\` });
            }
            if (!reason || reason.trim() === '') {
                return reject({ message: "A reason is required for rejecting a booking." });
            }
            booking.validationStatus = 'Rejected';
            booking.status = 'Rejected';
            booking.validatedByAdminId = adminId;
            booking.validationReason = reason;
            return resolve({ message: 'Booking rejected successfully.', booking: {...booking} });
          }
        }
        reject({ message: 'Booking not found for rejection.' });
      }, 200);
    });
  }
};
