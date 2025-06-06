const FEEDBACK_STORAGE_KEY = 'hotelFeedback';

// Helper to get all feedback from localStorage
const getAllFeedbackInternal = () => {
    const feedbackData = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    return feedbackData ? JSON.parse(feedbackData) : [];
};

// Helper to save all feedback to localStorage
const saveAllFeedback = (feedbackArray) => {
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(feedbackArray));
};

export const submitFeedback = async (bookingId, rating, comment, userId = 'mockUser') => {
    // In a real app, userId would come from an auth service or context
    console.log(`Submitting feedback for bookingId: ${bookingId}, userId: ${userId}`);
    const allFeedbacks = getAllFeedbackInternal();

    // Check if this user has already submitted feedback for this booking
    const existingFeedbackIndex = allFeedbacks.findIndex(fb => fb.bookingId === bookingId && fb.userId === userId);

    let feedbackEntry;
    if (existingFeedbackIndex > -1) {
        // Update existing feedback if found (optional behavior, could also prevent re-submission)
        allFeedbacks[existingFeedbackIndex] = {
            ...allFeedbacks[existingFeedbackIndex],
            rating,
            comment,
            timestamp: new Date().toISOString(), // Update timestamp
        };
        feedbackEntry = allFeedbacks[existingFeedbackIndex];
        console.log("Updated existing feedback.");
    } else {
        // Add new feedback
        feedbackEntry = {
            id: Date.now().toString(), // Unique ID for the feedback entry
            bookingId: String(bookingId), // Ensure bookingId is stored as string
            userId,
            rating,
            comment,
            timestamp: new Date().toISOString(),
        };
        allFeedbacks.push(feedbackEntry);
        console.log("Added new feedback.");
    }

    saveAllFeedback(allFeedbacks);
    return feedbackEntry; // Return the submitted or updated feedback
};

export const getFeedbackForBooking = async (bookingId) => {
    const allFeedbacks = getAllFeedbackInternal();
    // Ensure comparison is consistent (e.g., string to string)
    return allFeedbacks.find(fb => String(fb.bookingId) === String(bookingId)) || null;
};

// Checks if a specific user has submitted feedback for a booking.
// If userId is not provided, it will check if *any* feedback exists for that bookingId.
export const hasUserSubmittedFeedback = async (bookingId, userId) => {
    const allFeedbacks = getAllFeedbackInternal();
    if (userId) {
        return allFeedbacks.some(fb => String(fb.bookingId) === String(bookingId) && fb.userId === userId);
    }
    // If no userId, check if any feedback exists for the bookingId (might be less useful without user context)
    return allFeedbacks.some(fb => String(fb.bookingId) === String(bookingId));
};

// Function to get all feedback entries, typically for admin use
export const getAllBookingsFeedback = async () => {
    return getAllFeedbackInternal();
};

// Optional: A function to clear all feedback for testing or admin purposes
export const clearAllFeedback = () => {
    localStorage.removeItem(FEEDBACK_STORAGE_KEY);
    console.log("All feedback cleared from localStorage.");
};

// Example of how a specific user might get their feedback for a booking (if needed)
export const getUserFeedbackForBooking = async (bookingId, userId) => {
    if (!userId) {
        console.warn("getUserFeedbackForBooking called without userId");
        return null;
    }
    const allFeedbacks = getAllFeedbackInternal();
    return allFeedbacks.find(fb => String(fb.bookingId) === String(bookingId) && fb.userId === userId) || null;
};
