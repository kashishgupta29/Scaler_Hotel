import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import BookingDialog from './BookingDialog';
import RoomDialog from './RoomDialog';

export default function TopBar() {
  const navigate = useNavigate();
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);

  // Handle dialog close events
  const handleBookingDialogClose = (success) => {
    setIsBookingDialogOpen(false);
    if (success) {
      navigate('/');
    }
  };

  const handleRoomDialogClose = (success) => {
    setIsRoomDialogOpen(false);
    if (success) {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-500 text-white font-bold">S</div>
          <span className="text-xl font-bold text-gray-900">Scalar Hotel</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <NavLink 
              to="/" 
              end
              className={({isActive}) => 
                isActive 
                  ? 'font-medium text-primary-600 border-b-2 border-primary-500 py-1' 
                  : 'text-gray-600 hover:text-primary-600 py-1 hover:border-b-2 hover:border-primary-300'
              }
            >
              Dashboard
            </NavLink>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBookingDialogOpen(true)}
              className="rounded-md bg-primary-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              New Booking
            </button>
            
            <button
              onClick={() => setIsRoomDialogOpen(true)}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              New Room
            </button>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BookingDialog 
        isOpen={isBookingDialogOpen} 
        onClose={handleBookingDialogClose} 
      />
      
      <RoomDialog 
        isOpen={isRoomDialogOpen} 
        onClose={handleRoomDialogClose} 
      />
    </header>
  );
}
