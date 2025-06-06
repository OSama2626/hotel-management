import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import './App.css';
import LoginPage from './pages/LoginPage/LoginPage';
import RegistrationPage from './pages/RegistrationPage/RegistrationPage';
import RoomListPage from './pages/RoomListPage/RoomListPage';
import BookingPage from './pages/BookingPage/BookingPage';
import MyBookingsPage from './pages/MyBookingsPage/MyBookingsPage';

import AgentDashboardPage from './pages/AgentPages/AgentDashboardPage';
import AgentCreateBookingPage from './pages/AgentPages/AgentCreateBookingPage';
import AgentCreateClientPage from './pages/AgentPages/AgentCreateClientPage';
import AgentCheckInOutPage from './pages/AgentPages/AgentCheckInOutPage'; // Import placeholder

import { getCurrentUser, logoutUser } from './services/authService';

function App() {
  const navigate = useNavigate();
  const [currentUserForNav, setCurrentUserForNav] = React.useState(null);
  // Mock agent status - in a real app, this would be part of user's role
  const [isAgent, setIsAgent] = React.useState(false);

  React.useEffect(() => {
    const updateUserNav = async () => {
      const user = await getCurrentUser();
      setCurrentUserForNav(user);
      // Mock: if user is 'agent@example.com', consider them an agent
      // In a real app, user object should have a 'role' property.
      // For example, if (user && user.roles.includes('agent'))
      if (user && user.email === 'agent@example.com') { // Simple mock condition
        setIsAgent(true);
      } else {
        setIsAgent(false);
      }
    };
    updateUserNav();

    // This is a simple listener for re-checking on navigation or other events.
    // A global auth context/event system would be more robust.
    const handleAuthChange = () => updateUserNav();
    window.addEventListener('authChange', handleAuthChange); // Assuming authService dispatches this

    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, [navigate]); // navigate dependency helps re-check on route changes if needed

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUserForNav(null);
      setIsAgent(false); // Reset agent status on logout
      navigate('/login');
      window.dispatchEvent(new CustomEvent('authChange')); // Dispatch event
    } catch (error) {
      console.error("Logout failed:", error);
      // Handle error display to user if necessary
    }
  };

  // This function could be called after a successful login
  // by LoginPage to trigger an immediate nav update.
  // LoginPage would need to dispatch an 'authChange' event or App would pass this down.
  // const handleLoginSuccess = () => {
  //   window.dispatchEvent(new CustomEvent('authChange'));
  // };


  return (
    <div>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/rooms">Rooms</Link></li>
          {currentUserForNav ? (
            <>
              <li><Link to="/my-bookings">My Bookings</Link></li>
              {isAgent && <li><Link to="/agent">Agent Portal</Link></li>}
              <li><button onClick={handleLogout} className="nav-logout-btn">Logout ({currentUserForNav.name})</button></li>
            </>
          ) : (
            <>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
            </>
          )}
        </ul>
      </nav>
      <Routes>
        {/* Client Routes */}
        <Route path="/" element={<RoomListPage />} />
        {/* Pass a callback to LoginPage to inform App.js about login success */}
        <Route path="/login" element={<LoginPage /* onLoginSuccess={handleLoginSuccess} */ />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/rooms" element={<RoomListPage />} />
        <Route path="/book/:roomId" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />

        {/* Agent Routes - could be protected by a wrapper route in a real app */}
        {/* For now, access is simply shown/hidden by nav link based on mock isAgent state */}
        <Route path="/agent" element={<AgentDashboardPage />} />
        <Route path="/agent/create-booking" element={<AgentCreateBookingPage />} />
        <Route path="/agent/create-client" element={<AgentCreateClientPage />} />
        <Route path="/agent/manage-checkinout" element={<AgentCheckInOutPage />} />

      </Routes>
    </div>
  );
}
export default App;
