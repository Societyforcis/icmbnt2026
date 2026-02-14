import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardRedirect = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const role = localStorage.getItem('role');

        if (role === 'Reviewer') {
            navigate('/reviewer', { replace: true });
        } else if (role === 'Editor' || role === 'Admin') {
            // Stay on dashboard (EditorDashboard)
            return;
        } else if (role === 'Author') {
            navigate('/author-dashboard', { replace: true });
        } else {
            // No role found, redirect to login
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Redirecting...</p>
            </div>
        </div>
    );
};

export default DashboardRedirect;
