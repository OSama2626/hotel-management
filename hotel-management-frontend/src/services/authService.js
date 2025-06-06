// hotel-management-frontend/src/services/authService.js

// Mock user database (in-memory for now)
let users = []; // To store registered users
let currentUser = null; // To simulate a logged-in user session

export const registerUser = ({ name, email, password }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { // Simulate network delay
      if (users.find(user => user.email === email)) {
        reject({ message: 'Email already exists.' });
      } else {
        // In a real app, password should be hashed before saving
        const newUser = { id: Date.now().toString(), name, email, password };
        users.push(newUser);
        console.log('Registered users:', users);
        // Dispatch an event that App.js can listen to, to update nav
        window.dispatchEvent(new CustomEvent('authChange', { detail: { user: newUser } }));
        resolve({ user: newUser, message: 'Registration successful!' });
      }
    }, 500);
  });
};

export const loginUser = ({ email, password }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { // Simulate network delay
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        currentUser = user; // Simulate setting a session
        console.log('Logged in user:', currentUser);
        // Dispatch an event that App.js can listen to, to update nav
        window.dispatchEvent(new CustomEvent('authChange', { detail: { user: currentUser } }));
        resolve({ user, message: 'Login successful!' });
      } else {
        reject({ message: 'Invalid email or password.' });
      }
    }, 500);
  });
};

export const logoutUser = () => {
  return new Promise((resolve) => {
    setTimeout(() => { // Simulate network delay
      currentUser = null; // Simulate clearing session
      console.log('User logged out.');
      // Dispatch an event that App.js can listen to, to update nav
      window.dispatchEvent(new CustomEvent('authChange', { detail: { user: null } }));
      resolve({ message: 'Logout successful!' });
    }, 500);
  });
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    setTimeout(() => { // Simulate network delay
        resolve(currentUser);
    }, 100);
  });
};

// New functions to be added:

export const getAllUsers = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // In a real app, filter out agents or other non-client roles if necessary,
      // or this function might be admin/agent specific.
      // For now, returning all users for simplicity in agent client selection.
      resolve([...users]); // Return a copy of the users array
    }, 300);
  });
};

export const searchUsers = (searchTerm) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!searchTerm || !searchTerm.trim()) { // Check for null or empty trimmed string
        resolve([...users]); // Return all users if search term is empty
        return;
      }
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filteredUsers = users.filter(user =>
        (user.name && user.name.toLowerCase().includes(lowerSearchTerm)) ||
        (user.email && user.email.toLowerCase().includes(lowerSearchTerm))
      );
      resolve(filteredUsers);
    }, 300);
  });
};
