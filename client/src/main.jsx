import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import App from './App.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1e3a8a',
          colorInfo: '#2563eb',
          borderRadius: 8,
          fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
        },
        components: {
          Card: { headerBg: '#ffffff' },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
