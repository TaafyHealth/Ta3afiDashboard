import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component to handle authentication and authorization
 * @param {Object} props - Component props
 * @param {React.Component} props.children - Child components to render if authorized
 * @param {string} props.requiredRole - Required role to access the route (optional)
 */
function ProtectedRoute({ children, requiredRole }) {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');

    // If no token, redirect to login
    if (!token) {
        return <Navigate to="/Login" replace />;
    }

    // If a specific role is required, check if user has it
    if (requiredRole) {
        // Normalize roles for comparison (case-insensitive)
        const normalizedUserRole = userRole?.toLowerCase();
        const normalizedRequiredRole = requiredRole.toLowerCase();
        
        // Map role variations and permissions
        const roleMap = {
            'super': ['super', 'supervisor', 'admin'], // Admins can access supervisor routes
            'supervisor': ['super', 'supervisor', 'admin'], // Admins can access supervisor routes
            'admin': ['admin', 'administrator']
        };
        
        // Check if user role matches required role or any of its variations
        const allowedRoles = roleMap[normalizedRequiredRole] || [normalizedRequiredRole];
        const hasAccess = allowedRoles.includes(normalizedUserRole);
        
        if (!hasAccess) {
            // User doesn't have required role, redirect to dashboard
            return <Navigate to="/dashboard" replace />;
        }
    }

    // User is authenticated and authorized
    return children;
}

export default ProtectedRoute;
