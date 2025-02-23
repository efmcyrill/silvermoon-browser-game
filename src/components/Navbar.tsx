import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Rocket, Book, User, Menu } from 'lucide-react';

function Navbar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between">
          <div className="flex space-x-7">
            <Link to="/" className="flex items-center py-4">
              <Rocket className="h-8 w-8 text-blue-400 mr-2" />
              <span className="font-semibold text-gray-100 text-lg">Silver Moon</span>
            </Link>
            
            <div className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`py-4 px-2 ${
                  location.pathname === '/'
                    ? 'text-blue-400 border-b-4 border-blue-400 font-semibold'
                    : 'text-gray-300 font-semibold hover:text-blue-400 transition duration-300'
                }`}
              >
                Game
              </Link>
              <Link
                to="/docs"
                className={`py-4 px-2 ${
                  location.pathname === '/docs'
                    ? 'text-blue-400 border-b-4 border-blue-400 font-semibold'
                    : 'text-gray-300 font-semibold hover:text-blue-400 transition duration-300'
                }`}
              >
                <div className="flex items-center">
                  <Book className="h-4 w-4 mr-1" />
                  Documentation
                </div>
              </Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-3">
            <Link
              to="/login"
              className="py-2 px-4 font-medium text-gray-300 rounded hover:bg-blue-500 hover:text-white transition duration-300 flex items-center"
            >
              <User className="h-4 w-4 mr-1" />
              Login
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="outline-none p-2 rounded-md hover:bg-gray-700"
            >
              <Menu className="h-6 w-6 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Game
            </Link>
            <Link
              to="/docs"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/docs'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Documentation
            </Link>
            <Link
              to="/login"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location.pathname === '/login'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;