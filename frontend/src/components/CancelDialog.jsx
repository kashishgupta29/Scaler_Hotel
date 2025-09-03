import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

export default function CancelDialog({ isOpen, onClose, onConfirm, cancelTarget }) {
  if (!cancelTarget) return null;
  
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
          <div className="fixed inset-0 bg-black/50" />
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <Dialog.Title className="text-lg font-semibold">
                    Cancel Booking
                  </Dialog.Title>
                  <button className="text-gray-500 hover:text-gray-700" onClick={() => onClose(false)}>✕</button>
                </div>
                
                <div className="p-4">
                  <div className="space-y-4">
                    <div className="rounded-md bg-yellow-50 p-4">
                      <h3 className="text-sm font-medium text-yellow-800">Cancellation Policy</h3>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-yellow-700">
                        <li>48+ hours before start: 100% refund</li>
                        <li>24–48 hours before start: 50% refund</li>
                        <li>Less than 24 hours: No refund</li>
                      </ul>
                    </div>

                    <div className="rounded-md border p-4">
                      <h4 className="mb-3 text-sm font-medium text-gray-900">Refund Details</h4>
                      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-gray-500">Refund Percentage</dt>
                          <dd className="text-lg font-medium">{cancelTarget.estimate}%</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500">Refund Amount</dt>
                          <dd className="text-lg font-medium text-primary-600">
                            ₹{Math.round((cancelTarget.estimate/100) * cancelTarget.price)}
                          </dd>
                        </div>
                      </dl>
                      <p className="mt-2 text-xs text-gray-500">Final refund will be confirmed by the server after processing.</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 border-t px-4 py-3">
                  <button 
                    onClick={() => onClose(false)} 
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Keep Booking
                  </button>
                  <button 
                    onClick={() => onConfirm(cancelTarget.id)} 
                    className="rounded-md bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
                  >
                    Confirm Cancellation
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
