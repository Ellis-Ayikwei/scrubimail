import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { Key, Loader2, CheckCircle, Copy, Check, XCircle } from 'lucide-react';
import { APIKey } from '../../../services/apiKeyService';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: APIKey[];
  selectedApiKey: APIKey | null;
  setSelectedApiKey: (key: APIKey | null) => void;
  apiKeyLoading: boolean;
  copiedKey: string | null;
  copyApiKey: (key: string) => void;
  maskApiKey: (key: string) => string;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKeys,
  selectedApiKey,
  setSelectedApiKey,
  apiKeyLoading,
  copiedKey,
  copyApiKey,
  maskApiKey
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-2 sm:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xs sm:max-w-md lg:max-w-2xl mx-2 sm:mx-4 transform overflow-hidden rounded-lg sm:rounded-xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                <div className="p-3 sm:p-4 lg:p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="text-base sm:text-lg lg:text-xl font-semibold text-[#333333] dark:text-white flex items-center">
                      <Key className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#2ED8A3]" />
                      <span className="truncate">Select API Key</span>
                    </Dialog.Title>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 ml-2"
                    >
                      <XCircle className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-[#333333]/70 dark:text-gray-400 mt-2">
                    Choose an API key to use for email validation
                  </p>
                </div>

                <div className="p-3 sm:p-4 lg:p-6 overflow-y-auto max-h-60 sm:max-h-80 lg:max-h-96">
                  {apiKeyLoading ? (
                    <div className="flex flex-col sm:flex-row items-center justify-center py-4 sm:py-6 lg:py-8">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 animate-spin text-[#2ED8A3]" />
                      <span className="ml-2 text-[#333333] dark:text-white text-xs sm:text-sm lg:text-base">Loading API keys...</span>
                    </div>
                  ) : apiKeys.length === 0 ? (
                    <div className="text-center py-4 sm:py-6 lg:py-8">
                      <Key className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                      <h3 className="text-sm sm:text-base lg:text-lg font-medium text-[#333333] dark:text-white mb-2">No API Keys Found</h3>
                      <p className="text-xs sm:text-sm text-[#333333]/70 dark:text-gray-400 mb-3 sm:mb-4 px-2">
                        You need to create an API key before you can validate emails.
                      </p>
                      <button
                        onClick={() => {
                          onClose();
                          window.location.href = '/apikeys';
                        }}
                        className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-[#2ED8A3] text-white rounded-lg hover:bg-[#00C48C] transition-colors text-xs sm:text-sm lg:text-base"
                      >
                        Create API Key
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {apiKeys.map((apiKey) => (
                        <div
                          key={apiKey.id}
                          className={`p-2 sm:p-3 lg:p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedApiKey?.id === apiKey.id
                              ? 'border-[#2ED8A3] bg-[#2ED8A3]/5 dark:bg-[#2ED8A3]/10'
                              : 'border-gray-200 dark:border-gray-700 hover:border-[#2ED8A3]/50'
                          }`}
                          onClick={() => setSelectedApiKey(apiKey)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                                <span className="font-medium text-[#333333] dark:text-white text-xs sm:text-sm lg:text-base truncate">
                                  {maskApiKey(apiKey.key)}
                                </span>
                                {apiKey.is_active ? (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full dark:bg-green-900 dark:text-green-200 flex-shrink-0 w-fit">
                                    Active
                                  </span>
                                ) : (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full dark:bg-gray-700 dark:text-gray-200 flex-shrink-0 w-fit">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-[#333333]/70 dark:text-gray-400">
                                Created: {new Date(apiKey.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center justify-end sm:justify-start space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyApiKey(apiKey.key);
                                }}
                                className="p-1.5 sm:p-2 text-gray-400 hover:text-[#2ED8A3] transition-colors"
                                title="Copy API key"
                              >
                                {copiedKey === apiKey.key ? (
                                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                                ) : (
                                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                )}
                              </button>
                              {selectedApiKey?.id === apiKey.id && (
                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#2ED8A3]" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 sm:p-4 lg:p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                  <button
                    onClick={onClose}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-xs sm:text-sm lg:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                    }}
                    disabled={!selectedApiKey}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-[#2ED8A3] text-white rounded-lg hover:bg-[#00C48C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm lg:text-base"
                  >
                    Use Selected Key
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default ApiKeyModal;
