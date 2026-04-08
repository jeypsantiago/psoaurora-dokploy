import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { STORAGE_KEYS } from '../constants/storageKeys';
import { getStorageItem, removeStorageItem, setStorageItem } from '../services/storage';

interface GoogleAuthContextType {
    accessToken: string | null;
    setAccessToken: (token: string | null) => void;
    isAuthenticated: boolean;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

// Replace with actual Client ID from Google Cloud Console
const GOOGLE_CLIENT_ID = "548784515206-5fm039dandls75a00jabg9sohhajqo58.apps.googleusercontent.com";


export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [accessToken, setAccessToken] = useState<string | null>(() => {
        return getStorageItem(STORAGE_KEYS.googleAccessToken);
    });

    useEffect(() => {
        if (accessToken) {
            setStorageItem(STORAGE_KEYS.googleAccessToken, accessToken);
        } else {
            removeStorageItem(STORAGE_KEYS.googleAccessToken);
        }
    }, [accessToken]);

    const isAuthenticated = !!accessToken;

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleAuthContext.Provider value={{ accessToken, setAccessToken, isAuthenticated }}>
                {children}
            </GoogleAuthContext.Provider>
        </GoogleOAuthProvider>
    );
};

export const useGoogleAuth = () => {
    const context = useContext(GoogleAuthContext);
    if (context === undefined) {
        throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
    }
    return context;
};
