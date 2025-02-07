import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import TimeLine from './TimeLinePage';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/appConfig';
import { LayoutDashboard } from 'lucide-react';
import { useSocket } from '../contexts/socketContext';

const ServiceStatusPage = () => {

    const [activeServices, setActiveServices] = useState({});
    const [services, setServices] = useState([]);
    const [maintenance, setMaintenance] = useState([]);
    const [incidents, setIncidents] = useState([]);
    const navigate = useNavigate();

    const { socket } = useSocket();

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

    const fetchServices = async () => {
        console.log(apiUrl)
        try {
            const response = await fetch(`${apiUrl}/api/services/`);
            const data = await response.json();
            console.log(data)
            setServices(data);
            fetchIncidents();
            fetchMaintence();
        } catch (error) {
            console.error('Error fetching services:', error);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [])

    useEffect(() => {
        if (!socket) return;

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "SERVICE_STATUS_UPDATE") {
                setServices((prevGroups) => {
                    return prevGroups.map((group) => {
                        const updatedServices = group.services.map((service) => {
                            if (service.id === data.updatedService._id) {
                                return {
                                    ...service,
                                    status: data.updatedService.status,
                                    name: data.updatedService.name,
                                    link: data.updatedService.link
                                };
                            }
                            return service;
                        });

                        return {
                            ...group,
                            services: updatedServices
                        };
                    });
                });
            } else if (data.type === "CREATE_NEW_SERVICE") {
                fetchServices();
            } else if (data.type === "GROUP_NAME_UPDATE") {
                setServices((prevGroups) => {
                    return prevGroups.map((group) => {
                        if (group.id === data.updatedService._id) {
                            return {
                                ...group,
                                name: data.updatedService.name,
                                services: group.services
                            };
                        }
                        return group;
                    });
                });
            } else if (data.type === "REPORT_NEW_INCIDENT") {
                setIncidents((prev) => [...prev, data.incident])
            } else if (data.type === "UPDATE_INCIDENT") {
                setIncidents((prev) => {
                    return prev.map((incidentItem) => {
                        if (incidentItem._id === data.incident._id) {
                            return {
                                ...data.incident
                            }
                        }
                        return {
                            ...incidentItem
                        };
                    })
                })
            } else if (data.type === "SCHEDULE_NEW_MAINTENANCE") {
                setMaintenance((prev) => [
                    ...prev,
                    data.maintenance
                ]);
            } else if (data.type === "UPDATE_SCHEDULE_MAINTENANCE") {
                setMaintenance((prev) => {
                    return prev.map((maintenanceItem) => {
                        if (maintenanceItem._id === data.maintenance._id) {
                            return {
                                ...data.maintenance
                            }
                        }
                        return {
                            ...maintenanceItem
                        };
                    })
                })
            }
        };

        return () => {
            socket.onmessage = null;
        };
    }, [socket]);

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
                    <p className='text-[20px] cursor-pointer' onClick={() => fetchServices()}>Status Page</p>
                </div>
                <div className='flex flex-row items-center gap-2 bg-[#1a5f5d] cursor-pointer text-white px-4 py-2 rounded-[5px] hover:bg-[#237479] text-[14px]' onClick={() => {
                    navigate('/dashboard');
                }}>
                    <LayoutDashboard size={16} />
                    <p>
                        Dashboard
                    </p>
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
                                                    <div className='flex flex-col gap-2'>
                                                        <span className="text-gray-200 text-[15px]">{service.name}</span>
                                                        {service.link && <a href={service.link} target='_blank' className="text-[#d4d4d8] text-[12px] underline">Visit Website</a>}
                                                    </div>
                                                    <div>
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
                                                    </div>
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