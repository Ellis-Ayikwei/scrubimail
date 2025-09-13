import { Booking } from '../types/booking';
import axiosInstance from './axiosInstance';

export const getBooking = async (id: string): Promise<Booking> => {
    const response = await axiosInstance.get(`/bookings/${id}`);
    return response.data;
};

export const confirmBooking = async (id: string): Promise<Booking> => {
    const response = await axiosInstance.post(`/bookings/${id}/confirm`);
    return response.data;
};

export const cancelBooking = async (id: string): Promise<Booking> => {
    const response = await axiosInstance.post(`/bookings/${id}/cancel`);
    return response.data;
};

export const deleteBooking = async (id: string): Promise<void> => {
    await axiosInstance.delete(`/bookings/${id}`);
};
