import React from 'react';
import ServiceStatusPage from './components/ServiceStatusPage';
import LoginPage from './components/LoginPage'; // Make sure this file exists
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ComponentGroups from './components/ComponentGroups';
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
        },
        {
          path: '/component-groups',
          element:
            <ComponentGroups />
        }
      ]
    }
  ])
  return <RouterProvider router={router} />
}
export default App;