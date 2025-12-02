import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import React from "react";
import Navbar from "./components/Navbar";
import Home from "./components/Home";
import Contact from "./components/Contact";
import Signin from "./components/auth/Signin";
import Login from "./components/auth/Login";
import Commitee from "./components/Commitee";
import CallForPapers from "./components/CallforPaper";
import PaperSubmission from "./components/Papersubmission";
import SubmitPaperForm from "./components/SubmitPaperForm";
import Dashboard from "./components/EditorDashboard";
import ReviewerDashboard from "./components/ReviewerDashboard";
// Fixed the broken import statement
import RouteChangeTracker from "./components/RouteChangeTracker";
import VerifyEmail from "./components/auth/VerifyEmail";
import Registrations from "./components/Registrations";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import EditSubmission from "./components/EditSubmission";
import Venue from './components/Venue';
import KeynoteSpeakers from './components/KeynoteSpeakers';
import SpeakerProfile from './components/SpeakerProfile';
import AdminPanel from './components/AdminPanel';
import ReviewerConfirmation from './components/ReviewerConfirmation';
// import SubmitPaperForm from "./components/SubmitPaperForm";
// The App component should contain BrowserRouter
const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop /> {/* Add ScrollToTop component here */}
      <AppRoutes />
    </BrowserRouter>
  );
};

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = localStorage.getItem('token');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Role based protected route - checks JWT in localStorage and validates role
const RoleProtectedRoute = ({ children, roles = [] }: { children: React.ReactNode, roles?: string[] }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return <Navigate to="/login" replace />;
    const decoded = JSON.parse(atob(parts[1]));
    const userRole = decoded?.role;
    if (!userRole) return <Navigate to="/login" replace />;

    if (!roles.includes(userRole)) {
      // Not authorized for this route
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
};

// Route wrapper component that conditionally applies loading
const RouteWithLoading = ({ 
  element, 
  skipLoading = false,
  loadingTime = 300 
}: { 
  element: React.ReactNode, 
  skipLoading?: boolean, 
  loadingTime?: number 
}) => {
  return skipLoading ? (
    <>{element}</>
  ) : (
    <RouteChangeTracker loadingTime={loadingTime}>
      {element}
    </RouteChangeTracker>
  );
};

// Separate component for the routes
const AppRoutes = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={
          <RouteWithLoading element={<Home />} loadingTime={800} />
        } />
        <Route path="/contact" element={
          <RouteWithLoading element={<Contact />} />
        } />
        
        {/* Auth routes - no loading screen */}
        <Route path="/signin" element={<Signin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify" element={<VerifyEmail />} />
        
        {/* Reviewer Confirmation - Accept/Reject assignment */}
        <Route path="/reviewer/confirm" element={<ReviewerConfirmation />} />
        
        <Route path="/commitee" element={
          <RouteWithLoading element={<Commitee />} />
        } />
        
        {/* Admin Dashboard - protected route for admins only */}
        <Route path="/admin" element={
          <RoleProtectedRoute roles={["Admin"]}>
            <RouteWithLoading element={<AdminPanel />} />
          </RoleProtectedRoute>
        } />
        
        {/* Apply loading effect to Dashboard */}
        <Route path="/dashboard" element={
          <RoleProtectedRoute roles={["Editor","Admin"]}>
            <RouteWithLoading element={<Dashboard/>} />
          </RoleProtectedRoute>
        } />
        
        {/* Reviewer Dashboard - protected route for reviewers */}
        <Route path="/reviewer" element={
          <RoleProtectedRoute roles={["Reviewer"]}>
            <RouteWithLoading element={<ReviewerDashboard />} />
          </RoleProtectedRoute>
        } />
        
        {/* Reviewer Dashboard Alias - for email links */}
        <Route path="/reviewer-dashboard" element={
          <RoleProtectedRoute roles={["Reviewer"]}>
            <RouteWithLoading element={<ReviewerDashboard />} />
          </RoleProtectedRoute>
        } />
        
        {/* Backup link route - reviewer can access specific paper review */}
        <Route path="/reviewer/review/:submissionId" element={
          <RoleProtectedRoute roles={["Reviewer"]}>
            <ReviewerDashboard />
          </RoleProtectedRoute>
        } />
        
        {/* Make Call for Papers accessible to all, but protect Paper Submission */}
        <Route path="/call-for-papers" element={
          <RouteWithLoading element={<CallForPapers />} />
        } />
        
        {/* Protected routes with loading - only accessible when logged in */}
        <Route path="/paper-submission" element={
          <ProtectedRoute>
            <RouteWithLoading element={<PaperSubmission />} />
          </ProtectedRoute>
        } />
        <Route path="/submit-paper" element={
          <ProtectedRoute>
            <RouteWithLoading element={<SubmitPaperForm isOpen={true} onClose={() => {}} embedded={false} onSubmissionSuccess={() => {}} />} />
          </ProtectedRoute>
        } />
        <Route path="/registrations" element={
          <ProtectedRoute>
            <RouteWithLoading element={<Registrations />} />
          </ProtectedRoute>
        } />
        
        {/* Add loading effect to EditSubmission route */}
        <Route path="/edit-submission/:submissionId" element={
          <ProtectedRoute>
            <RouteWithLoading element={<EditSubmission />} />
          </ProtectedRoute>
        } />
        
        {/* Add loading effects to keynote and venue routes */}
        <Route path="/venue" element={
          <RouteWithLoading element={<Venue />} loadingTime={600} />
        } />
        <Route path="/keynote-speakers" element={
          <RouteWithLoading element={<KeynoteSpeakers />} loadingTime={600} />
        } />
        <Route path="/keynote-speakers/:speakerId" element={
          <RouteWithLoading element={<SpeakerProfile />} loadingTime={500} />
        } />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer/>
    </>
  );
};

export default App;