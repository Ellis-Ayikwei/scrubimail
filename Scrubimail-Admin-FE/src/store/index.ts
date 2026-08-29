import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import themeConfigReducer from './themeConfigSlice';
import draftRequestsReducer from './slices/draftRequestsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    themeConfig: themeConfigReducer,
    draftRequests: draftRequestsReducer,
  },
  devTools: import.meta.env.MODE !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type IRootState = RootState; // Add this for compatibility
export default store; 