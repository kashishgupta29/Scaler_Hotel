import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { api } from '../api/client.js';
import { toast } from 'react-hot-toast';

export default function RoomDialog({ isOpen, onClose }) {
  const [form, setForm] = useState({ room_number: '', type: 'A', price_per_hour: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  // Reset form when dialog opens
  function handleOnClose(success = false) {
    if (!success) {
      setForm({ room_number: '', type: 'A', price_per_hour: '' });
      setError('');
    }
    onClose(success);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        room_number: Number(form.room_number),
        type: form.type,
        price_per_hour: Number(form.price_per_hour),
      };
      await api.createRoom(payload);
      toast.success('Room created');
      handleOnClose(true); // true indicates successful submission
    } catch (e) {
      setError(e.message || 'Failed to create room');
      toast.error(e.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleOnClose}>
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
                  Create New Room
                </Dialog.Title>

                <form onSubmit={onSubmit} className="mt-4 space-y-4">
                  {error && <div className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">{error}</div>}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Number</label>
                    <input 
                      type="number" 
                      name="room_number" 
                      value={form.room_number} 
                      onChange={onChange} 
                      required 
                      min={1}
                      className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                      placeholder="e.g., 101" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Room Type</label>
                    <select 
                      name="type" 
                      value={form.type} 
                      onChange={onChange} 
                      required 
                      className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Price per Hour (₹)</label>
                    <input 
                      type="number" 
                      name="price_per_hour" 
                      value={form.price_per_hour} 
                      onChange={onChange} 
                      required 
                      min={1}
                      className="mt-1 block w-full rounded-md border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm" 
                      placeholder="e.g., 500" 
                    />
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button 
                      type="button" 
                      onClick={() => handleOnClose(false)}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={loading}
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                    >
                      Create Room
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
