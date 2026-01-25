import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import AOS from 'aos';
import 'aos/dist/aos.css';

// Import necessary components for route configuration
// import EditSubmission from './components/EditSubmission.tsx'

// Initialize AOS
//m
AOS.init({
  duration: 400, // Reduced from 800ms
  once: true,
  easing: 'ease-out-quad',
  offset: 50, // Trigger animations earlier
  delay: 0, // Ensure no delay
});

// Make sure we're mounting to the correct element
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Root element not found! Check your index.html");
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
