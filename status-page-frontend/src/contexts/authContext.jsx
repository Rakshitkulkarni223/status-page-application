import { CONSTANTS } from '../utils/constants';
import { React, createContext, useReducer, useCallback, useContext, useMemo } from 'react';

const initialState = {
    user: {},
    token: null,
    expires: null,
    isAuthenticated: false,
    status: CONSTANTS.AUTH_STATUS.PENDING
};

const AuthContext = createContext({
    ...initialState,
    login: (user = {}, token = '', expires = '') => {},
    logout: () => { },
    setAuthStatus: (status = '') => {},
    setOwnedServices: (ownedServices = []) => {}
});

const authReducer = (state, action) => {
    switch (action.type) {
        case 'login': {
            return {
                user: action.payload.user,
                token: action.payload.token,
                expires: action.payload.expires,
                isAuthenticated: true,
                status: CONSTANTS.AUTH_STATUS.SUCCESS,
            }
        }
        case 'logout': {
            return {
                ...initialState,
                status: CONSTANTS.AUTH_STATUS.IDLE,
            }
        }
        case 'status': {
            return {
                ...state,
                status: action.payload.status,
            }
        }
        case 'setOwnedServices': {
            return {
                ...state,
                user: {
                    ...state.user,
                    owned_service_groups: action.payload.ownedServices,
                },
            };
        }
    }
};


const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    const login = useCallback((user, token, expires) => {
        dispatch({
            type: 'login',
            payload: {
                user,
                token,
                expires
            },
        });
    }, []);

    const logout = useCallback(() => {
        dispatch({
            type: 'logout'
        });
    }, []);

    const setAuthStatus = useCallback((status) => {
        dispatch({
            type: 'status',
            payload: {
                status
            }
        });
    }, []);

    const setOwnedServices = useCallback((ownedServices) => {
        dispatch({
            type: 'setOwnedServices',
            payload: { ownedServices }
        });
    }, []);


    const value = useMemo(() => ({ ...state, login, logout, setAuthStatus, setOwnedServices }), [state, login, logout, setAuthStatus, setOwnedServices])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}


const useAuth = () => {
    const context = useContext(AuthContext);

    if (context === undefined) {
        throw new Error('useAuth must be used within a AuthProvider');
    }

    return context;
};

export {
    AuthProvider,
    useAuth
}