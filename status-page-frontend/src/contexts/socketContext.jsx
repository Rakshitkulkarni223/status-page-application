import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiUrl, socketServer } from '../config/appConfig';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        const socketInstance = new WebSocket(socketServer);
          

        socketInstance.onopen = () => {
            console.log('WebSocket connected');
        };

        socketInstance.onclose = (e) => {
            console.log('WebSocket disconnected with code:', e.code);
        };

        setSocket(socketInstance);

        return () => {
            socketInstance.close();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
};
