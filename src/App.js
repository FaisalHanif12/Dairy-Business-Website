import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar/Navbar';
import LoginForm from './Navbar/LoginForm'; // Assuming LoginForm is in the same directory
import Home from './Navbar/Home'; // Make sure the path to your Home component is correct
import ConsumersSales from './Navbar/ConsumersDales'; // Adjust the path as needed
import RelativesKhata from './Navbar/RelativesKhata'; // Adjust the path as needed
import ConsumerKhata from './Navbar/ConsumerKhata'; // Adjust the path as needed
import Expenditure from './Navbar/Expenditure'; // Adjust the path as needed
import Employee from './Navbar/Employee'; // Adjust the path as needed
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (username, password) => {
    setIsLoggedIn(true);
  };

  // A component to protect your routes
  const ProtectedRoute = ({ children }) => {
    return isLoggedIn ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      {isLoggedIn && <Navbar />}
      <Routes>
        <Route path="/login" element={<LoginForm onLogin={handleLogin} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <ConsumersSales />
            </ProtectedRoute>
          }
        />
        <Route
          path="/about"
          element={
            <ProtectedRoute>
              <RelativesKhata />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <ConsumerKhata />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenditure"
          element={
            <ProtectedRoute>
              <Expenditure />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee"
          element={
            <ProtectedRoute>
              <Employee />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
