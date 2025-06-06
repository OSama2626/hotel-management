import React, { useEffect, useState } from 'react';
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
import AgentCheckInOutPage from './pages/AgentPages/AgentCheckInOutPage';
import AgentBillingPage from './pages/AgentPages/AgentBillingPage';

import AdminDashboardPage from './pages/AdminPages/AdminDashboardPage';
import AdminManageAgentsPage from './pages/AdminPages/AdminManageAgentsPage';
import AdminManageHotelsPage from './pages/AdminPages/AdminManageHotelsPage';
import AdminManageTariffsPage from './pages/AdminPages/AdminManageTariffsPage';
import AdminValidateBookingsPage from './pages/AdminPages/AdminValidateBookingsPage';
import AdminStatisticsPage from './pages/AdminPages/AdminStatisticsPage'; // Import actual page
// Placeholders for other admin pages to be created
// const AdminManageHotelsPage = () => <div className="admin-page"><header className="admin-header"><h1>Manage Hotels</h1></header><main className="admin-content"><p>Hotel Management (CRUD) - Coming Soon</p></main></div>; // Placeholder removed
// const AdminManageTariffsPage = () => <div className="admin-page"><header className="admin-header"><h1>Manage Tariffs</h1></header><main className="admin-content"><p>Tariff Management - Coming Soon</p></main></div>; // Placeholder removed
// const AdminValidateBookingsPage = () => <div className="admin-page"><header className="admin-header"><h1>Validate Bookings</h1></header><main className="admin-content"><p>Booking Validation - Coming Soon</p></main></div>; // Placeholder removed
// const AdminStatisticsPage = () => <div className="admin-page"><header className="admin-header"><h1>Statistics</h1></header><main className="admin-content"><p>Statistics & Dashboard - Coming Soon</p></main></div>; // Placeholder removed


import { getCurrentUser, logoutUser, getAllUsers as getAllAuthUsers } from './services/authService';
import { syncAuthUsers } from './services/roomService';

function App() {
  const navigate = useNavigate();
  const [currentUserForNav, setCurrentUserForNav] = useState(null);
  const [isAgent, setIsAgent] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false); // New state for Admin
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      setAppLoading(true);
      try {
        const user = await getCurrentUser();
        setCurrentUserForNav(user);
        if (user) {
          setIsAgent(user.email === 'agent@example.com'); // Mock agent role
          setIsAdmin(user.email === 'admin@example.com'); // Mock admin role
        } else {
          setIsAgent(false);
          setIsAdmin(false);
        }
        const allUsers = await getAllAuthUsers();
        syncAuthUsers(allUsers);
      } catch (error) {
        console.error("Error during app initialization:", error);
      } finally {
        setAppLoading(false);
      }
    };
    initializeApp();

    const handleAuthChange = async (event) => {
      const user = event.detail?.user;
      setCurrentUserForNav(user);
      if (user) {
        setIsAgent(user.email === 'agent@example.com'); // Mock agent role
        setIsAdmin(user.email === 'admin@example.com'); // Mock admin role
      } else {
        setIsAgent(false);
        setIsAdmin(false);
      }
      // Re-sync users on any auth change for simplicity in this mock setup
      try {
        const allUsers = await getAllAuthUsers();
        syncAuthUsers(allUsers);
      } catch (error) {
        console.error("Error re-syncing users on authChange:", error);
      }
    };
    window.addEventListener('authChange', handleAuthChange);
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser(); // This should trigger authChange via authService
      // UI updates (currentUserForNav, isAgent, isAdmin) are handled by authChange listener
      navigate('/login'); // Explicit navigation after logout is fine
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (appLoading) {
    return <div className="app-loading">Loading Application...</div>;
  }

  return (
    <div>
      <nav>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/rooms">Rooms</Link></li>
          {currentUserForNav ? (
            <>
              <li><Link to="/my-bookings">My Bookings</Link></li>
              {/* Show Agent Portal link if user is an agent AND NOT an admin */}
              {isAgent && !isAdmin && <li><Link to="/agent">Agent Portal</Link></li>}
              {/* Show Admin Portal link if user is an admin (admin might also be an agent, but Admin Portal takes precedence or is separate) */}
              {isAdmin && <li><Link to="/admin">Admin Portal</Link></li>}
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/rooms" element={<RoomListPage />} />
        <Route path="/book/:roomId" element={<BookingPage />} />
        <Route path="/my-bookings" element={<MyBookingsPage />} />

        {/* Agent Routes */}
        {/* These routes can remain accessible if an admin is also an agent,
            or could be conditionally rendered based on !isAdmin && isAgent if strict separation is needed.
            For now, if isAgent is true, these are available. The nav link logic provides primary role distinction.
        */}
        <Route path="/agent" element={<AgentDashboardPage />} />
        <Route path="/agent/create-booking" element={<AgentCreateBookingPage />} />
        <Route path="/agent/create-client" element={<AgentCreateClientPage />} />
        <Route path="/agent/manage-checkinout" element={<AgentCheckInOutPage />} />
        <Route path="/agent/billing" element={<AgentBillingPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/manage-hotels" element={<AdminManageHotelsPage />} />
        <Route path="/admin/manage-tariffs" element={<AdminManageTariffsPage />} />
        <Route path="/admin/manage-agents" element={<AdminManageAgentsPage />} />
        <Route path="/admin/validate-bookings" element={<AdminValidateBookingsPage />} />
        <Route path="/admin/statistics" element={<AdminStatisticsPage />} />

      </Routes>
    </div>
  );
}
export default App;
