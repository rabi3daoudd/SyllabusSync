import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { GoogleOAuthProvider } from '@react-oauth/google';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
    <React.StrictMode>
        <GoogleOAuthProvider clientId="REPLACE WITH YOUR CLIENT ID">
            <App />
        </GoogleOAuthProvider>
    </React.StrictMode>,
);
