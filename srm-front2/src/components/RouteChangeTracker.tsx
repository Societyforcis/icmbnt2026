import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';

interface RouteChangeTrackerProps {
  children: React.ReactNode;
  loadingTime?: number;
}

const RouteChangeTracker: React.FC<RouteChangeTrackerProps> = ({ 
  children, 
  loadingTime = 800
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    // Reset loading state on route change
    setIsLoading(true);
    
    console.log(`Loading route: ${location.pathname} with loading time: ${loadingTime}ms`);
    
    // Set minimum loading time to ensure animation is visible
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log(`Finished loading route: ${location.pathname}`);
    }, loadingTime);
    
    // Clean up timeout on unmount or route change
    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname, loadingTime]);

  return isLoading ? <LoadingScreen /> : <>{children}</>;
};

export default RouteChangeTracker;
