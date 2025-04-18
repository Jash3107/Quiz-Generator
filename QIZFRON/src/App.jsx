import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Signup } from './components/Signup';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import QuizComponent from './components/QuizComponent';
import ResultsComponent from './components/ResultsComponent';
import DynamicQuiz from './components/DynamicQuiz'; // Import the new component

const App = () => {
  const [token, setToken] = useState(null);

  // Check for token in localStorage on initial render
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // Optional: Handle logout (clear token and redirect to login)
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<DynamicQuiz />} /> {/* Added new route */}
        <Route
          path="/quiz"
          element={
            token ? (
              <Sidebar>
                <QuizComponent token={token} />
              </Sidebar>
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/results"
          element={
            token ? (
              <Sidebar>
                <ResultsComponent token={token} />
              </Sidebar>
            ) : (
              <Login />
            )
          }
        />
      </Routes>
    </Router>
  );
};

export default App;