import { Calendar, Home, Inbox, Search, CircleAlert, LogOut, Icon } from "lucide-react";
import { useState } from "react";
import DashboardHome from "./DashboardHome";
import ComponentGroups from "./ComponentGroups";
import Components from "./Components";
import Incidents from "./Incidents";
import Schedules from "./Schedules";

import { useNavigate } from 'react-router-dom';

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
        key: "DashboardHome"
    },
    {
        title: "Component Groups",
        url: "/component-groups",
        icon: Inbox,
        key: "ComponentGroups"
    },
    {
        title: "Components",
        url: "/components",
        icon: Calendar,
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
        icon: Calendar,
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('owned_service_groups');
        navigate('/login'); 
    };
    

    return (
        <div className="flex h-screen">
            <div className="w-2 bg-gray-1500 text-gray p-4">
                <div className="text-xl font-bold mb-6">Status page Dashboard</div>
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
            <div className="flex-1 bg-gray-900 p-6">
                <p className="text-right cursor-pointer text-red-400 mb-3" onClick={handleLogout}>Logout</p>
                {getSelectedPage(selected)}
            </div>
        </div>
    );
}

export default Dashboard;
