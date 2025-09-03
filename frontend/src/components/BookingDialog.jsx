import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { api, ceilHoursBetween } from '../api/client.js';
import { toast } from 'react-hot-toast';

export default function BookingDialog({ isOpen, onClose, bookingId = null }) {
  const isEdit = Boolean(bookingId);
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [form, setForm] = useState({ 
    user_email: '', 
    room_type: '',
    room_number: '', 
    start_time: '', 
    end_time: '' 
  });

  const roomByNumber = useMemo(() => {
    const map = new Map();
    rooms.forEach(r => map.set(String(r.room_number), r));
    return map;
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    if (!form.room_type) return rooms;
    return rooms.filter(r => r.type === form.room_type);
  }, [rooms, form.room_type]);

  const selectedRoom = roomByNumber.get(String(form.room_number));
  const price = useMemo(() => {
    const hours = ceilHoursBetween(form.start_time, form.end_time);
    const pph = selectedRoom?.price_per_hour || 0;
    return hours * pph;
  }, [form.start_time, form.end_time, selectedRoom]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => {
      const newForm = { ...prev, [name]: value };
      // Reset room number when room type changes
      if (name === 'room_type') {
        newForm.room_number = '';
      }
      return newForm;
    });
  }

  async function loadRooms() {
    try {
      const res = await api.getRooms();
      setRooms(res.rooms || []);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to load rooms');
    }
  }

  async function loadExisting() {
    if (!isEdit) return;
    setLoading(true);
    try {
      const res = await api.getBookings();
      const found = (res.bookings || []).find(b => b.id === bookingId);
      if (found) {
        const room = found.room ?? rooms.find(r => r.id === found.room_id);
        const roomNumber = room?.room_number;
        setForm({
          user_email: found.user_email,
          room_type: room?.type || '',
          room_number: roomNumber || '',
          start_time: found.start_time.slice(0, 16),
          end_time: found.end_time.slice(0, 16),
        });
      }
    } catch (e) {
      setError('Failed to load booking');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (isOpen) {
      loadRooms(); 
      setError('');
      if (!isEdit) {
        setForm({ user_email: '', room_type: '', room_number: '', start_time: '', end_time: '' });
      }
    }
  }, [isOpen, isEdit]);
  
  useEffect(() => { 
    if (rooms.length && isEdit && isOpen) loadExisting(); 
  }, [rooms, isEdit, bookingId, isOpen]);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const room = roomByNumber.get(String(form.room_number));
      if (!room) throw new Error('Select a valid room');
      const payload = {
        user_email: form.user_email,
        room_id: room.id,
        start_time: new Date(form.start_time).toISOString(),
        end_time: new Date(form.end_time).toISOString(),
      };
      if (isEdit) {
        await api.updateBooking(bookingId, payload);
        toast.success('Booking updated');
      } else {
        await api.createBooking(payload);
        toast.success('Booking created');
      }
      onClose(true); // true indicates successful submission
    } catch (e) {
      setError(e.message || 'Failed to submit');
      toast.error(e.message || 'Failed to submit');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => onClose(false)}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {isEdit ? 'Edit Booking' : 'New Booking'}
                </Dialog.Title>

                <form onSubmit={onSubmit} className="mt-4 space-y-4">
                  {error && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">User Email</label>
                      <input 
                        type="email" 
                        name="user_email" 
                        value={form.user_email} 
                        onChange={onChange} 
                        required 
                        className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                        placeholder="user@example.com" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Room Type</label>
                      <select 
                        name="room_type" 
                        value={form.room_type} 
                        onChange={onChange} 
                        required 
                        className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="" disabled>Select room type</option>
                        <option value="Standard">Standard</option>
                        <option value="Deluxe">Deluxe</option>
                        <option value="Superior">Superior</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Room Number</label>
                      <select 
                        name="room_number" 
                        value={form.room_number} 
                        onChange={onChange} 
                        required 
                        disabled={!form.room_type}
                        className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="" disabled>
                          {!form.room_type ? 'Select room type first' : 'Select room'}
                        </option>
                        {filteredRooms.map(r => (
                          <option key={r.id} value={r.room_number}>
                            Room {r.room_number} • ₹{r.price_per_hour}/hr
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time</label>
                      <input 
                        type="datetime-local" 
                        name="start_time" 
                        value={form.start_time} 
                        onChange={onChange} 
                        required 
                        className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time</label>
                      <input 
                        type="datetime-local" 
                        name="end_time" 
                        value={form.end_time} 
                        onChange={onChange} 
                        required 
                        className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                      />
                    </div>
                  </div>

                  <div className="rounded-md bg-gray-50 px-3 py-2 text-sm flex justify-between items-center">
                    <span className="text-gray-700">Dynamic Price</span>
                    <span className="font-medium text-primary-600">₹{price || 0}</span>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      type="button" 
                      onClick={() => onClose(false)}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      {isEdit ? 'Update Booking' : 'Create Booking'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
