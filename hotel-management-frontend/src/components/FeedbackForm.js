import React, { useState, useEffect } from 'react';
import './FeedbackForm.css'; // Optional: if you create and want to use a CSS file

const FeedbackForm = ({ bookingId, onSubmitFeedback, existingFeedback }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmittedOrHasExisting, setIsSubmittedOrHasExisting] = useState(false);

    useEffect(() => {
        if (existingFeedback) {
            setRating(existingFeedback.rating);
            setComment(existingFeedback.comment);
            setIsSubmittedOrHasExisting(true);
        } else {
            // Reset form if existingFeedback is not provided (e.g., when switching between bookings)
            setRating(0);
            setComment('');
            setIsSubmittedOrHasExisting(false);
        }
    }, [existingFeedback]);

    const handleStarClick = (selectedRating) => {
        if (isSubmittedOrHasExisting) return;
        setRating(selectedRating);
    };

    const handleCommentChange = (e) => {
        if (isSubmittedOrHasExisting) return;
        setComment(e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (rating === 0 || comment.trim() === '') {
            alert('Please provide both a rating (1-5 stars) and a comment.');
            return;
        }
        onSubmitFeedback({ bookingId, rating, comment });
        setIsSubmittedOrHasExisting(true); // Mark as submitted to change view
    };

    // If feedback exists or has been newly submitted, show read-only view
    if (isSubmittedOrHasExisting) {
        return (
            <div className="feedback-display">
                <h4>{existingFeedback ? 'Your Submitted Feedback' : 'Thank You for Your Feedback!'}</h4>
                <p>Booking ID: {bookingId}</p>
                <div className="star-rating read-only">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <span
                            key={star}
                            className={star <= rating ? 'star filled' : 'star'}
                            style={{ fontSize: '20px', color: star <= rating ? 'gold' : 'lightgray' }}
                        >
                            {star <= rating ? '★' : '☆'}
                        </span>
                    ))}
                </div>
                <p>Comment: {comment}</p>
            </div>
        );
    }

    // Otherwise, show the form
    return (
        <form onSubmit={handleSubmit} className="feedback-form">
            <h4>Submit Feedback for Booking ID: {bookingId}</h4>
            <div className="star-rating interactive">
                {[1, 2, 3, 4, 5].map((star) => (
                    <span
                        key={star}
                        className={`star ${star <= rating ? 'filled' : ''}`}
                        onClick={() => handleStarClick(star)}
                    >
                        {star <= rating ? '★' : '☆'}
                    </span>
                ))}
            </div>
            <textarea
                value={comment}
                onChange={handleCommentChange}
                placeholder="Enter your comments..."
                rows="4"
                required
                aria-label="Feedback comment"
            />
            <button type="submit" disabled={rating === 0 || comment.trim() === ''}>
                Submit Feedback
            </button>
        </form>
    );
};

export default FeedbackForm;
