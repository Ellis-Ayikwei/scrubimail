import { notification } from 'antd';

export const showMessage = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    notification[type]({
        message: type === 'error' ? 'Error' : type === 'success' ? 'Success' : type === 'warning' ? 'Warning' : 'Info',
        description: message,
        placement: 'topRight',
        duration: type === 'error' ? 6 : 4,
    });
};
