import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { apiUrl } from '../config/appConfig';
import { useAuth } from '../contexts/authContext';
import { useSocket } from '../contexts/socketContext';
import Loader from './Loader';

const DashboardHome = () => {
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [serviceStatuses, setServiceStatuses] = useState({});

  const [changedServiceStatuses, setChangedServiceStatuses] = useState({});
  const { user, setOwnedServices, token } = useAuth();

  const { socket } = useSocket();

  const [loading, setLoading] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const [loadingGroup, setLoadingGroup] = useState(null);

  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((group) => group !== groupId)
        : [...prev, groupId]
    );
  };

  const handleStatusChange = (serviceId, newStatus) => {
    setServiceStatuses((prevStatuses) => ({
      ...prevStatuses,
      [serviceId]: newStatus,
    }));

    setChangedServiceStatuses((prevStatuses) => ({
      ...prevStatuses,
      [serviceId]: true,
    }));
  };

  const [services, setServices] = useState([]);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/api/services`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      setServices(data);
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      alert(error);
      console.error('Error fetching services:', error);
    }
  };

  const handleSetStatus = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/services/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: serviceStatuses[id] }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Service status updated successfully!');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error status update failed:', error);
      alert('Error status update failed.');
    }
    setLoading(false);
    setChangedServiceStatuses((prevStatuses) => ({
      ...prevStatuses,
      [id]: false,
    }));
  };

  const subscribeToService = async (serviceGroupId) => {
    try {
      setLoadingGroup(serviceGroupId);
      const response = await fetch(`${apiUrl}/api/subscription/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ serviceGroupId })
      });

      const data = await response.json();
      setOwnedServices(data.owned_service_groups)
      if (response.ok) {
        alert('Subscribed successfully!');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    }
    setLoadingGroup(null);
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
      }
    };

    return () => {
      socket.onmessage = null;
    };
  }, [socket]);

  const renderUserDashboard = () => {
    return (
      <>
        <h3 className="text-lg font-semibold">Dashboard</h3>
        <div className="space-y-4 mt-4">
          {isLoading ? <Loader loaderText='Fetching services...' /> : services?.length > 0 ? services
            .map((group) => (
              <div key={group.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
                <div
                  className="flex justify-between items-center cursor-pointer"
                  onClick={() => toggleGroup(group.id)}
                >
                  <div>
                    <h4 className="text-lg font-semibold">{group.name}</h4>
                  </div>
                  <div className="flex flex-row justify-between items-center cursor-pointer gap-2">
                    <button disabled={user?.owned_service_groups?.includes(group.id)} className={user?.owned_service_groups?.includes(group.id) ? "bg-gray-600 text-white text-[12px] py-1 px-2 rounded-[5px]" : "bg-[#237479] text-white text-[12px] py-1 px-2 rounded-[5px] hover:bg-[#1a5f5d]"}
                      onClick={(e) => {
                        e.stopPropagation();
                        subscribeToService(group.id);
                      }}>
                      {loadingGroup !== group.id ? "Subscribe" : "Subscribing..."}
                    </button>
                    <span>{expandedGroups?.includes(group.id) ? <ChevronUp /> : <ChevronDown />}</span>
                  </div>

                </div>
                {expandedGroups?.includes(group.id) && (
                  <ul className="mt-4 space-y-2">
                    {group.services.map((service) => (
                      <li key={service.id} className="flex justify-between items-center py-3 border-b-[1px]">
                        <p className="text-sm">{service.name}</p>
                        <span
                          className={`px-2 py-1 rounded-[5px] text-white text-[12px] ${getStatusClass(serviceStatuses[service.id] || service.status)}`}
                        >
                          {serviceStatuses[service.id] || service.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
            : <div className='flex flex-col gap-3'>
              <p className='p-2 bg-gray-800 rounded-[5px] border-[1px] border-gray-600 text-left'>No services found.</p>
            </div>}

        </div>
      </>
    );
  };

  const renderAdminDashboard = () => {
    return (
      <>
        <h3 className="text-lg font-semibold">Dashboard</h3>
        <div className="space-y-4 mt-4">
          {isLoading ? <Loader /> : services?.length > 0 ? services.map((group) => (
            <div key={group.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleGroup(group.id)}
              >
                <h4 className="text-lg font-semibold">{group.name}</h4>
                <span>{expandedGroups?.includes(group.id) ? <ChevronUp /> : <ChevronDown />}</span>
              </div>
              {expandedGroups?.includes(group.id) && (
                <ul className="mt-2 space-y-2">
                  {group.services.map((service) => (
                    <li key={service.id} className="flex justify-between items-center py-2 border-b-[1px]">
                      <div className="flex flex-col">
                        <p className="text-[15px]">{service.name}</p>
                        <div className="mt-2 flex flex-wrap gap-3">
                          <div key={service.id} className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleStatusChange(service.id, "Operational")}
                              className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Operational" || (!serviceStatuses[service.id] && service.status === "Operational") ? "bg-green-700 text-white hover:bg-green-800" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                            >
                              Operational
                            </Button>
                            <Button
                              onClick={() => handleStatusChange(service.id, "Degraded Performance")}
                              className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Degraded Performance" || (!serviceStatuses[service.id] && service.status === "Degraded Performance") ? "bg-purple-700 text-white hover:bg-purple-800" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                            >
                              Degraded Performance
                            </Button>
                            <Button
                              onClick={() => handleStatusChange(service.id, "Partial Outage")}
                              className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Partial Outage" || (!serviceStatuses[service.id] && service.status === "Partial Outage") ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                            >
                              Partial Outage
                            </Button>
                            <Button
                              onClick={() => handleStatusChange(service.id, "Major Outage")}
                              className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Major Outage" || (!serviceStatuses[service.id] && service.status === "Major Outage") ? "bg-red-800 text-white hover:bg-red-900" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                            >
                              Major Outage
                            </Button>
                          </div>
                          {changedServiceStatuses[service.id] && <div className='flex gap-2'> <Button
                            onClick={() => handleSetStatus(service.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[12px] rounded-[10px] shadow-md transition-all duration-300"
                          >
                            {!loading ? "Update status" : "Updating..."}
                          </Button>
                            <Button
                              onClick={() => {
                                setServiceStatuses((prevStatuses) => ({
                                  ...prevStatuses,
                                  [service.id]: group.services[service.id],
                                }));

                                setChangedServiceStatuses((prevStatuses) => ({
                                  ...prevStatuses,
                                  [service.id]: false,
                                }));
                              }}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[12px] rounded-[10px] shadow-md transition-all duration-300"
                            >
                              Discard
                            </Button>
                          </div>
                          }
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )) : <div className='flex flex-col gap-3'>
            <p className='p-2 bg-gray-800 rounded-[5px] border-[1px] border-gray-600 text-left'>No services found.</p>
          </div>}
        </div>
      </>
    );
  };

  return (
    <div>
      {user.role === "Admin" ? renderAdminDashboard() : renderUserDashboard()}
    </div>
  );
};

const getStatusClass = (status) => {
  switch (status) {
    case "Operational":
      return "bg-green-700";
    case "Degraded Performance":
      return "bg-purple-700";
    case "Partial Outage":
      return "bg-red-600";
    case "Major Outage":
      return "bg-red-800";
    default:
      return "bg-gray-500";
  }
};

export default DashboardHome;
