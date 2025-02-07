import { Calendar, CalendarSync, Inbox, LayoutDashboard, CircleAlert, Group, Component } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import DashboardHome from "./DashboardHome";
import ComponentGroups from "./ComponentGroups";
import Components from "./Components";
import Incidents from "./Incidents";
import Schedules from "./Schedules";

import { useNavigate } from 'react-router-dom';
import { useAuth } from "../contexts/authContext";
import { CONSTANTS } from "../utils/constants";
import { apiUrl } from "../config/appConfig";

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
        key: "DashboardHome"
    },
    {
        title: "Component Groups",
        url: "/component-groups",
        icon: Group,
        key: "ComponentGroups"
    },
    {
        title: "Components",
        url: "/components",
        icon: Component,
        key: "Components"
    },
    {
        title: "Incidents",
        url: "/incidents",
        icon: CircleAlert,
        key: "Incidents"
    },
    {
        title: "Schedules",
        url: "/schedules",
        icon: CalendarSync,
        key: "Schedules"
    }
];

const getSelectedPage = (page) => {
    switch (page) {
        case "DashboardHome": {
            return <DashboardHome />;
        }
        case "ComponentGroups": {
            return <ComponentGroups />;
        }
        case "Components": {
            return <Components />
        }
        case "Incidents": {
            return <Incidents />
        }
        case "Schedules": {
            return <Schedules />
        }
    }
};

function Dashboard() {
    const [selected, setSelected] = useState('DashboardHome');

    const navigate = useNavigate();
    const { logout, login, setAuthStatus } = useAuth();

    const token = localStorage.getItem('token');

    const refreshAccessToken = useCallback(async () => {
        try {
            const response = await fetch(`${apiUrl}/api/auth/refreshToken`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                let user = {
                    "id": data.userId,
                    "role": data.role,
                    "owned_service_groups": data.owned_service_groups,
                }
                const expires = data.expires;
                localStorage.setItem('token', token);

                login(user, token, expires);
                setAuthStatus(CONSTANTS.AUTH_STATUS.SUCCESS);
            } else {
                logout();
                localStorage.removeItem('token');
                navigate('/login');
            }
        } catch (err) {
            logout();
            localStorage.removeItem('token');
            navigate('/login');
        }

    }, [login, logout, setAuthStatus]);

    useEffect(() => {
        refreshAccessToken();
    }, [refreshAccessToken])


    const handleLogout = () => {
        logout();
        localStorage.removeItem('token');
        navigate('/login');
    };


    return (
        <div className="flex h-screen">
         <div className="w-64 bg-gray-900 text-white p-4"> 
                <div className="text-xl font-bold mb-6 cursor-pointer" onClick={() => navigate('/')}>Status Page</div>
                <div>
                    {items.map((item) => (
                        <div
                            key={item.title}
                            onClick={() => setSelected(item.key)}
                            className={`flex items-center px-3 py-2 rounded-[5px] mb-3 cursor-pointer 
                                ${selected === item.key ? 'bg-gray-700 text-white' : 'hover:bg-gray-800'}`}
                        >
                            <item.icon className="mr-3" />
                            <p className="text-sm">{item.title}</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 bg-gray-900 p-4">
                <div className="mb-6">
                    <p className="text-right cursor-pointer text-red-400 mb-3" onClick={handleLogout}>Logout</p>
                </div>
                <div>
                    {getSelectedPage(selected)}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
