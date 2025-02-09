import React from 'react';
import ServiceStatusPage from './components/ServiceStatusPage';
import LoginPage from './components/LoginPage';
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import SignupPage from './components/SignUpPage';

function App() {
  const router = createBrowserRouter([
    {
      element: <Layout />,
      children: [
        {
          path: '/',
          element:
            <ServiceStatusPage />
        },
        {
          path: '/signup',
          element:
            <SignupPage />
        },
        {
          path: '/login',
          element:
            <LoginPage />
        },
        {
          path: '/dashboard',
          element:
            <Dashboard />
        }
      ]
    }
  ])
  return <RouterProvider router={router} />
}

export default App;