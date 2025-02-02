import React, { useState } from 'react';
import {useNavigate} from 'react-router-dom'

const SignupPage = () => {

    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();
            console.log(data)
            if (response.ok) {
                navigate('/login')
                setFormData({ username: '', email: '', password: '' }); 
            } else {
                setMessage(data.message || 'Failed to register');
            }
        } catch (error) {
            setMessage('Error: Unable to connect to the server');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col justify-center items-center">
            <div className="bg-gray-800 py-4 px-4 rounded-[10px] shadow-md w-full max-w-lg">
            <h2 className="text-2xl font-semibold text-center mb-4 text-[#2acac5]">Status Page</h2>
            <h2 className="text-2xl font-semibold text-center mb-6">Sign Up</h2>
                {message && <p className="text-red-400">{message}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-300 text-sm">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-300 text-sm">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full p-2 rounded bg-gray-700 text-white focus:outline-none"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-[#237479] hover:bg-[#277f85] text-white p-2 rounded"
                        disabled={loading}
                    >
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                    <div className="flex flex-row gap-2">

                    <p>Already have an account?</p><p className='text-[#1a7df3] cursor-pointer' onClick={()=>navigate('/login')}>Login</p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;