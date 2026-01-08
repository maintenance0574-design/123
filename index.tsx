
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 建立 React 根節點並渲染 App 組件
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
