"use client";

import { createContext, useContext, useState, ReactNode, FunctionComponent } from 'react';

interface AuthContextType {
    isAuthenticated: boolean;
    setIsAuthenticated: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: FunctionComponent<AuthProviderProps> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    // const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

    const value = { isAuthenticated, setIsAuthenticated };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};