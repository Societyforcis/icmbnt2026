// import React from 'react';

interface RouteTransitionProps {
  children: React.ReactNode;
}

const RouteTransition: React.FC<RouteTransitionProps> = ({ children }) => {
  // We'll temporarily remove the loading animation to see if that's causing issues
  return <>{children}</>;
};

export default RouteTransition;
