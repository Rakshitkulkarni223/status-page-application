import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/appConfig';
import { useAuth } from '../contexts/authContext';
import { CONSTANTS } from '../utils/constants';

const LoginPage = () => {
    const navigate = useNavigate(); 

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const { login, user, setAuthStatus, logout } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            const response = await fetch(`${apiUrl}/api/auth/signin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            let user = {
                "id": data.userId,
                "role": data.role,
                "owned_service_groups": data.owned_service_groups,
            }
            let token = data.token;
            let expires = data.expires;

            localStorage.setItem('token', token);

            login(user, token, expires);
            setAuthStatus(CONSTANTS.AUTH_STATUS.SUCCESS);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
            logout();
            localStorage.removeItem('token');
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col justify-center items-center">
            <div className="bg-gray-800 py-4 px-4 rounded-[10px] shadow-md w-full max-w-lg">
                <h2 className="text-2xl font-semibold text-center mb-4 text-[#2acac5]">Status Page</h2>
                <h2 className="text-2xl font-semibold text-center mb-3">Sign in</h2>
                {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className="w-full p-2 bg-gray-700 rounded-[8px] text-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-mediumm mb-2">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="w-full p-2 bg-gray-700 rounded-[8px] text-white"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="mt-4 w-full bg-[#237479] text-white py-2 rounded-[8px] hover:bg-[#277f85]">Sign in</button>
                    <div className="flex flex-row gap-2">
                    <p>New to status page?</p><p className='text-[#1a7df3] cursor-pointer' onClick={()=>navigate('/signup')}>Create new account</p>
                    </div>
                    
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
