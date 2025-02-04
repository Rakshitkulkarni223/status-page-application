import React, { useState, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import TimeLine from './TimeLinePage';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/appConfig';

const ServiceStatusPage = () => {
    const [activeServices, setActiveServices] = useState({});
    const [services, setServices] = useState([]);
    const [maintenance, setMaintenance] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/services`);
                const data = await response.json();
                setServices(data);
            } catch (error) {
                console.error('Error fetching services:', error);
            }
        };
        fetchServices();
    }, []);

    const fetchMaintence = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/maintenance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            setMaintenance(data);
        } catch (error) {
            console.error('Error subscribing:', error);
        }
    };

    const fetchIncidents = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/incidents`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            setIncidents(data);
        } catch (error) {
            console.error('Error subscribing:', error);
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, [])

    useEffect(() => {
        fetchMaintence();
    }, [])

    const toggleService = (id) => {
        setActiveServices((prevState) => ({
            ...prevState,
            [id]: !prevState[id]
        }));
    };


    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col">
            <nav className="bg-gray-900 py-3 px-4 flex justify-between border-b-[1px] items-center">
                <div className="text-white text-2xl font-semibold">
                    <p className='text-[20px]'>Status Page</p>
                </div>
                <div>
                    <button className="bg-[#237479] text-white px-4 py-2 rounded-[5px] hover:bg-blue-700 text-[15px]" onClick={() => navigate('/login')}>
                        Dashboard
                    </button>
                </div>
            </nav>

            <main className="flex-1 p-6 space-y-6 w-full max-w-5xl mx-auto">
                <section className="services-list space-y-4">
                    <h2 className="text-2xl font-semibold">Services</h2>
                    {services.map((group) => {
                        const affectedIncidents = [];
                        return (
                            <div
                                key={group.id}
                                className="bg-gray-800 rounded-lg shadow-md hover:shadow-xl"
                            >
                                <div className="flex justify-between items-center p-4">
                                    <div className="flex items-center space-x-2">
                                        <div>
                                            <span className="font-medium text-md">{group.name}</span>
                                        </div>
                                        <div className='cursor-pointer'>
                                            <ChevronDownIcon
                                                className={`h-8 w-8 transition-transform ${activeServices[group.id] ? 'rotate-180' : ''}`}
                                                onClick={() => toggleService(group.id)}
                                            />
                                        </div>
                                    </div>
                                    {affectedIncidents.length !== 0 ?
                                        <div className="flex">
                                            <span className="font-medium text-gray-300 text-[10px] p-1 px-2 border border-gray-300 rounded-[4px]">
                                                {`${affectedIncidents.length} Incident${affectedIncidents.length !== 1 ? 's' : ''}`}
                                            </span>
                                        </div> : undefined}
                                </div>

                                {activeServices[group.id] && (
                                    <div className="space-y-2">
                                        <ul className="space-y-2">
                                            {group.services.map((service) => (
                                                <li
                                                    key={service.id}
                                                    className="flex justify-between items-center p-4 border-b border-gray-60"
                                                >
                                                    <span className="text-gray-200 text-[15px]">{service.name}</span>
                                                    <span
                                                        className={`inline-block px-2 py-0 rounded-[5px] text-[12px] text-white ${service.status === 'Operational'
                                                            ? 'bg-green-700'
                                                            : service.status === 'Degraded Performance'
                                                                ? 'bg-[#533969]'
                                                                : service.status === 'Partial Outage' ?
                                                                    'bg-red-600' :
                                                                    'bg-red-800'
                                                            }`}
                                                    >
                                                        {service.status}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </section>

                <TimeLine timelines={incidents} type={"Incident"} />
                <TimeLine timelines={maintenance} type={"Maintenance"} />

            </main>
        </div>
    );
};

export default ServiceStatusPage;