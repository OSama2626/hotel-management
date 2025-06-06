// hotel-management-frontend/src/services/roomService.js
const mockRoomDatabase = [
  { id: '1', hotelId: 'H1', name: 'Cozy Single Room', type: 'Single', location: 'Downtown Hotel', price: 100, availability: 'Available', amenities: ['Wi-Fi', 'TV', 'Air Conditioning'], bookings: [] },
  { id: '2', hotelId: 'H1', name: 'Spacious Double Room', type: 'Double', location: 'Downtown Hotel', price: 150, availability: 'Available', amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Balcony'], bookings: [] },
  { id: '3', hotelId: 'H2', name: 'Luxury Suite', type: 'Suite', location: 'Sea View Resort', price: 300, availability: 'Booked', amenities: ['Wi-Fi', 'Large TV', 'Air Conditioning', 'Jacuzzi', 'Mini Bar'], bookings: [{startDate: '2024-01-01', endDate: '2024-01-05', userId: 'user1', bookingId: 'B_old_1', status: 'Confirmed' }] },
  { id: '4', hotelId: 'H2', name: 'Comfort Double Room', type: 'Double Confort', location: 'Sea View Resort', price: 180, availability: 'Available', amenities: ['Wi-Fi', 'TV', 'Air Conditioning', 'Desk'], bookings: [] },
  { id: '5', hotelId: 'H3', name: 'Basic Single', type: 'Single', location: 'Airport Wing Hotel', price: 80, availability: 'Available', amenities: ['Wi-Fi', 'TV'], bookings: [] },
  { id: '6', hotelId: 'H1', name: 'Another Suite', type: 'Suite', location: 'Downtown Hotel', price: 280, availability: 'Available', amenities: ['Wi-Fi', 'TV', 'Jacuzzi'], bookings: [] },
];

// Mock hotel data
const mockHotels = [
    { id: 'H1', name: 'Downtown Hotel', city: 'Metropolis' },
    { id: 'H2', name: 'Sea View Resort', city: 'Bayview' },
    { id: 'H3', name: 'Airport Wing Hotel', city: 'Airtown' },
];

export const getHotels = async () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockHotels);
    }, 200);
  });
};

export const getAvailableRooms = async (filters = {}) => {
  console.log("Filtering rooms with:", filters);
  return new Promise((resolve) => {
    setTimeout(() => {
      let filteredRooms = mockRoomDatabase.filter(room => {
        // Consider a room available if it's not explicitly 'Booked' OR if it has no conflicting bookings for the given dates
        if (room.availability === 'Booked' && (!filters.startDate || !filters.endDate)) {
            return false; // If strictly 'Booked' and no dates provided for conflict check, assume unavailable
        }
        if (filters.startDate && filters.endDate) {
            const newStart = new Date(filters.startDate);
            const newEnd = new Date(filters.endDate);
            const hasConflict = room.bookings.some(booking => {
                if (booking.status === 'Cancelled') return false;
                const existingStart = new Date(booking.startDate);
                const existingEnd = new Date(booking.endDate);
                return newStart < existingEnd && newEnd > existingStart;
            });
            if (hasConflict) return false; // Room is not available if there's a date conflict
        }
        return true; // Available if no conflicts or not marked 'Booked'
      });

      if (filters.roomType && filters.roomType !== '') {
        filteredRooms = filteredRooms.filter(room => room.type === filters.roomType);
      }

      if (filters.hotelId && filters.hotelId !== '') {
        filteredRooms = filteredRooms.filter(room => room.hotelId === filters.hotelId);
      }

      resolve(filteredRooms);
    }, 500);
  });
};

export const getRoomById = async (id) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const room = mockRoomDatabase.find(r => r.id === id);
      if (room) {
        resolve(room);
      } else {
        reject({ message: "Room not found" });
      }
    }, 300);
  });
};

export const bookService = {
  createBooking: async (roomId, userId, startDate, endDate) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const roomIndex = mockRoomDatabase.findIndex(r => r.id === roomId);
        if (roomIndex === -1) {
          return reject({ message: "Room not found for booking." });
        }

        const room = mockRoomDatabase[roomIndex];
        const isConflict = room.bookings.some(booking => {
            if (booking.status === 'Cancelled') return false;
            const existingStart = new Date(booking.startDate);
            const existingEnd = new Date(booking.endDate);
            const newStart = new Date(startDate);
            const newEnd = new Date(endDate);
            return (newStart < existingEnd && newEnd > existingStart);
        });

        if (isConflict) {
            return reject({ message: "Selected dates conflict with an existing booking for this room." });
        }

        const newBooking = {
          bookingId: `B${Date.now()}`,
          roomId,
          userId,
          startDate,
          endDate,
          bookedAt: new Date().toISOString(),
          status: 'Confirmed' // Default status
        };
        mockRoomDatabase[roomIndex].bookings.push(newBooking);
        // Optionally, if a room should be marked 'Booked' after any booking:
        // mockRoomDatabase[roomIndex].availability = 'Booked';
        console.log(`Booking created for room ${roomId}:`, newBooking);
        resolve({ ...newBooking, roomName: room.name, roomLocation: room.location }); // Include room details in response
      }, 700);
    });
  },

  getUserBookings: async (userId) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const userBookings = [];
        mockRoomDatabase.forEach(room => {
          room.bookings.forEach(booking => {
            if (booking.userId === userId) {
              userBookings.push({
                ...booking,
                roomName: room.name,
                roomLocation: room.location,
                roomPrice: room.price // Add roomPrice for total calculation
              });
            }
          });
        });
        // Sort by most recent booking first
        resolve(userBookings.sort((a, b) => new Date(b.bookedAt) - new Date(a.bookedAt)));
      }, 500);
    });
  },

  cancelBooking: async (bookingId, userId) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let bookingFoundAndCancelled = false;
            for (const room of mockRoomDatabase) {
                const bookingIndex = room.bookings.findIndex(b => b.bookingId === bookingId && b.userId === userId);
                if (bookingIndex !== -1) {
                    if (room.bookings[bookingIndex].status === 'Cancelled') {
                        return reject({ message: 'This booking is already cancelled.' });
                    }
                    // Check if booking is in the past, etc. (additional cancellation rules can be added here)
                    room.bookings[bookingIndex].status = 'Cancelled';
                    bookingFoundAndCancelled = true;
                    // After cancelling, the room might become available again if it was marked 'Booked' due to this booking
                    // This logic depends on how room.availability is managed.
                    // For simplicity, we are not changing room.availability here.
                    console.log('Booking cancelled:', room.bookings[bookingIndex]);
                    resolve({ message: 'Booking cancelled successfully.', booking: room.bookings[bookingIndex] });
                    break;
                }
            }
            if (!bookingFoundAndCancelled) {
                reject({ message: 'Booking not found or you do not have permission to cancel it.' });
            }
        }, 500);
    });
  }
};
