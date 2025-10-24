import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { LoginUser } from '../../store/authSlice';
import { showMessage } from '../../utils/notifications';
import { getDeviceInfo } from '../../utils/DeviceFingerPrint';
import ssoService from '../../services/ssoService';

const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing OAuth callback...');
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get device info for fingerprinting
        const device = getDeviceInfo();
        setDeviceInfo(device);

        // Check for OAuth callback data in URL
        const callbackData = ssoService.handleCallbackFromUrl();
        
        if (callbackData) {
          // Handle successful OAuth login
          dispatch(LoginUser({
            email: '', // OAuth users don't need email/password
            password: '',
            trust_device: false,
            device_id: device?.device_id,
            device_name: device?.device_name,
            fingerprint: device?.fingerprint,
            user_id: '', // Will be set by backend
            session_id: '',
            device_info: device?.device_info,
            extra: {
              access_token: callbackData.access_token,
              refresh_token: callbackData.refresh_token,
              provider: callbackData.provider
            }
          }));
          
          setStatus('success');
          setMessage(`Successfully logged in with ${callbackData.provider}!`);
          
          // Clear URL parameters
          ssoService.clearCallbackFromUrl();
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 2000);
        } else {
          // No callback data found
          setStatus('error');
          setMessage('No OAuth callback data found. Please try logging in again.');
          
          // Redirect to login after a delay
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 3000);
        }
      } catch (error: any) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('OAuth callback failed. Please try logging in again.');
        
        // Redirect to login after a delay
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 3000);
      }
    };

    handleCallback();
  }, [dispatch, navigate]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-8 h-8 animate-spin text-[#2ED8A3]" />;
      case 'success':
        return <CheckCircle className="w-8 h-8 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-600" />;
      default:
        return <Loader2 className="w-8 h-8 animate-spin text-[#2ED8A3]" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-[#2ED8A3]';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-[#2ED8A3]';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F5F7] dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-gradient-to-r from-[#2ED8A3] to-[#004E8A] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-[#333333] dark:text-white">
            OAuth Callback
          </h2>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              {getStatusIcon()}
            </div>
            
            <h3 className={`text-lg font-semibold ${getStatusColor()}`}>
              {status === 'loading' && 'Processing...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Error'}
            </h3>
            
            <p className="text-[#333333]/70 dark:text-gray-400">
              {message}
            </p>
            
            {status === 'loading' && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-[#2ED8A3] h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            )}
            
            {status === 'success' && (
              <div className="mt-4">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Redirecting to dashboard...
                </p>
              </div>
            )}
            
            {status === 'error' && (
              <div className="mt-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 bg-[#2ED8A3] text-white rounded-lg hover:bg-[#00C48C] transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;