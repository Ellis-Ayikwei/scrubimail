import React from 'react';

const AdminMessages: React.FC = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
                <p className="text-gray-500 dark:text-gray-300 mt-1">Manage your messages here</p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <p className="text-gray-600 dark:text-gray-300">
                    Messages management interface coming soon...
                </p>
            </div>
        </div>
    );
};

export default AdminMessages;
