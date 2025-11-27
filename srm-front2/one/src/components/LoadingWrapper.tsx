import { useState, useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

interface LoadingWrapperProps {
  children: React.ReactNode;
  loadingTime?: number;
}

const LoadingWrapper: React.FC<LoadingWrapperProps> = ({ children, loadingTime = 300 }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set loading to true whenever the component mounts or key changes
    setIsLoading(true);
    
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, loadingTime);

    return () => clearTimeout(timer);
  }, [loadingTime]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
};

export default LoadingWrapper;
