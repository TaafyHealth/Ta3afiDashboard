import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import logoImage from '../../content/ta3afiLogo.png';
import globalVar from '../../public Func/globalVar';
import { Button, Input } from '../../components/ui';
import './Login.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(globalVar.backendURL + '/super/login', {
        email,
        password,
      });

      const data = response.data;
      for (const key of Object.keys(data)) {
        localStorage.setItem(key, data[key]);
      }

      window.location.href = '/dashboard';
    } catch (err) {
      console.error(err);
      setError(err.response?.data || 'An error occurred while logging in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Background Pattern */}
      <div className="login-background">
        <div className="background-pattern"></div>
        <div className="background-gradient"></div>
      </div>

      {/* Login Container */}
      <div className="login-container">
        <div className="login-card">
          {/* Logo and Header */}
          <div className="login-header">
            <div className="login-logo">
              <img src={logoImage} alt="Ta3afy Logo" className="logo-img" />
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Ta3afy Admin Dashboard</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="login-error">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form">
            <Input
              label="Email Address"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ta3afy.com"
              leftIcon={<FontAwesomeIcon icon={faEnvelope} />}
              required
              fullWidth
              size="lg"
              disabled={loading}
            />

            <div className="password-field">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftIcon={<FontAwesomeIcon icon={faLock} />}
                rightIcon={
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                }
                required
                fullWidth
                size="lg"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              disabled={loading || !email || !password}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <p className="login-footer-text">
              {/* Secure admin access to Ta3afy platform */}
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="login-info">
          <p>Need help? Contact the system administrator</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
