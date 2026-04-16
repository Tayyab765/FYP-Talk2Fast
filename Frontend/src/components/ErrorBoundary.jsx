import React, { Component } from 'react';
import { Link } from 'react-router-dom';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h1 style={{ fontSize: '2rem', color: '#b91c1c', marginBottom: '1rem' }}>Something went wrong.</h1>
          <p style={{ color: '#4b5563', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            We encountered an unexpected error while trying to render this page.
            If the backend is not running, please start all services and try again.
          </p>
          <div style={{ padding: '1rem', background: '#fee2e2', color: '#991b1b', borderRadius: '8px', marginBottom: '2rem', display: 'inline-block', textAlign: 'left', maxWidth: '800px', overflow: 'auto' }}>
            <code>{this.state.error && this.state.error.toString()}</code>
          </div>
          <div>
            <button 
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{ padding: '0.75rem 1.5rem', background: '#1d4ed8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginRight: '1rem' }}
            >
              Reload Page
            </button>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: '#1d4ed8', fontWeight: 'bold' }}>
              Back to Dashboard
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
