import io from 'socket.io-client';
import { SERVER_URL } from './constants';

export const initializeSocket = () => {
    return io.connect(SERVER_URL);
};
