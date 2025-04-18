import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Sidebar = ({ children, handleLogout }) => {
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen">
      <nav className="w-64 p-6 bg-gray-200">
        <h3 className="text-xl font-bold mb-6">Quiz App</h3>
        <ul className="space-y-4">
          <li>
            <Link to="/quiz" className="text-blue-600 hover:underline">
              Take Quiz
            </Link>
          </li>
          <li>
            <Link to="/results" className="text-blue-600 hover:underline">
              Results
            </Link>
          </li>
          <li>
            <button
              onClick={onLogout}
              className="text-blue-600 hover:underline bg-none border-none cursor-pointer"
            >
              Logout
            </button>
          </li>
        </ul>
      </nav>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
};