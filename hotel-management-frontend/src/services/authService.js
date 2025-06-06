// Mock user database
let users = [
  // Pre-seed an admin, agent, and a client for easier testing
  { id: 'admin0', name: 'Admin User', email: 'admin@example.com', password: 'password', role: 'admin' },
  { id: 'agent0', name: 'Agent User', email: 'agent@example.com', password: 'password', role: 'agent' },
  { id: 'client0', name: 'Client User', email: 'client@example.com', password: 'password', role: 'client' },
];
let currentUser = null; // To simulate a logged-in user session

export const registerUser = ({ name, email, password, role = 'client' }) => { // Added role, defaults to 'client'
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (users.find(user => user.email === email)) {
        reject({ message: 'Email already exists.' });
      } else {
        const newUser = { id: `user${Date.now()}`, name, email, password, role };
        users.push(newUser);
        console.log('Registered users:', users);
        // Do not automatically log in the new user here; let login be a separate step.
        // currentUser = newUser; // Removed auto-login on register
        window.dispatchEvent(new CustomEvent('authChange', { detail: { type: 'register', user: null } })); // Notify about user list change
        resolve({ user: newUser, message: 'Registration successful! Please log in.' });
      }
    }, 500);
  });
};

export const loginUser = ({ email, password }) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        currentUser = user;
        console.log('Logged in user:', currentUser);
        window.dispatchEvent(new CustomEvent('authChange', { detail: { type: 'login', user: currentUser } }));
        resolve({ user, message: 'Login successful!' });
      } else {
        reject({ message: 'Invalid email or password.' });
      }
    }, 500);
  });
};

export const logoutUser = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const oldUser = currentUser;
      currentUser = null;
      console.log('User logged out.');
      window.dispatchEvent(new CustomEvent('authChange', { detail: { type: 'logout', user: null, oldUser: oldUser } }));
      resolve({ message: 'Logout successful!' });
    }, 500);
  });
};

export const getCurrentUser = () => {
  return new Promise((resolve) => {
    setTimeout(() => { resolve(currentUser); }, 100);
  });
};

export const getAllUsers = () => {
  return new Promise((resolve) => {
    setTimeout(() => { resolve([...users]); }, 300);
  });
};

export const searchUsers = (searchTerm) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!searchTerm || !searchTerm.trim()) { // check for null or empty string
        resolve([...users]); return;
      }
      const lowerSearchTerm = searchTerm.toLowerCase();
      const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(lowerSearchTerm) ||
        user.email?.toLowerCase().includes(lowerSearchTerm)
      );
      resolve(filteredUsers);
    }, 300);
  });
};

// Mock function for admin actions - these don't persist changes beyond console logs for now
export const adminUpdateUserRole = (userId, newRole) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => { // Added setTimeout for async simulation
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex === -1) return reject({ message: "User not found." });

        // Prevent changing own role if current user is the one being changed to non-admin
        // This is a conceptual safety, real BE would handle this better
        if (currentUser && currentUser.id === userId && currentUser.role === 'admin' && newRole !== 'admin') {
            // return reject({ message: "Admin cannot change their own role from admin." });
            // For mock, let's allow it but log a warning
            console.warn("Admin is changing their own role from 'admin'. This might lock them out in a real app.");
        }

        users[userIndex].role = newRole;
        console.log(`Admin: Changed role of user ${users[userIndex].email} to ${newRole}. (Mock update)`);
        // If the updated user was the currentUser, update currentUser as well
        if (currentUser && currentUser.id === userId) {
            currentUser.role = newRole;
            window.dispatchEvent(new CustomEvent('authChange', { detail: { type: 'roleChange', user: currentUser } }));
        }
        resolve({ user: { ...users[userIndex] }, message: `Role updated to ${newRole}.` });
      }, 300);
    });
};

export const adminResetUserPassword = (userId) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => { // Added setTimeout for async simulation
        const user = users.find(u => u.id === userId);
        if (!user) return reject({ message: "User not found." });
        // This is a mock. In a real app, you'd generate a temp password or send a reset link.
        const tempPassword = "newPassword123"; // Example temporary password
        user.password = tempPassword; // Not actually secure for a real app
        console.log(`Admin: Password for user ${userId} (${user.email}) has been reset to '${tempPassword}'. (Mock action)`);
        resolve({ message: `Password for ${user.email} reset to a temporary value (mock).`});
      }, 300);
    });
};
