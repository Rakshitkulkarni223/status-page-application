import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { apiUrl } from '../config/appConfig';

const user = {
  id: localStorage.getItem("userId"),
  role: localStorage.getItem('role'),
  owned_service_groups: localStorage.getItem('owned_service_groups')?.split(',')
};

const DashboardHome = () => {
  const [expandedGroups, setExpandedGroups] = useState([]);
  const [serviceStatuses, setServiceStatuses] = useState({});

  const [changedServiceStatuses, setChangedServiceStatuses] = useState({});


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
      const response = await fetch(`${apiUrl}/api/services`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  const handleSetStatus = async (id) => {
    try {
      const response = await fetch(`${apiUrl}/api/services/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    setChangedServiceStatuses((prevStatuses) => ({
      ...prevStatuses,
      [id]: false,
    }));
  };

  const subscribeToService = async (serviceGroupId) => {
    try {
      const response = await fetch(`${apiUrl}/api/subscription/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ serviceGroupId })
      });

      const data = await response.json();
      console.log(data);
      localStorage.setItem("owned_service_groups", JSON.stringify(data))
      if (response.ok) {
        alert('Subscribed successfully!');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [])

  const renderUserDashboard = () => {
    return (
      <>
        <h3 className="text-lg font-semibold">Dashboard</h3>
        <div className="space-y-4 mt-4">
          {services
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
                    <button className="bg-[#237479] text-white text-[12px] py-1 px-2 rounded hover:bg-[#1a5f5d]" onClick={() => { subscribeToService(group.id) }}>
                      Subscribe
                    </button>
                    <span>{expandedGroups.includes(group.id) ? <ChevronUp /> : <ChevronDown />}</span>
                  </div>

                </div>
                {expandedGroups.includes(group.id) && (
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
            ))}
        </div>
      </>
    );
  };

  const renderAdminDashboard = () => {
    return (
      <>
        <h3 className="text-lg font-semibold">Service Groups</h3>
        <div className="space-y-4 mt-4">
          {services.map((group) => (
            <div key={group.id} className="bg-gray-800 p-4 rounded-lg shadow-lg">
              <div
                className="flex justify-between items-center cursor-pointer"
                onClick={() => toggleGroup(group.id)}
              >
                <h4 className="text-lg font-semibold">{group.name}</h4>
                <span>{expandedGroups.includes(group.id) ? <ChevronUp /> : <ChevronDown />}</span>
              </div>
              {expandedGroups.includes(group.id) && (
                <ul className="mt-2 space-y-2">
                  {group.services.map((service) => (
                    <li key={service.id} className="flex justify-between items-center py-2 border-b-[1px]">
                      <div className="flex flex-col">
                        <p className="text-[15px]">{service.name}</p>
                        <div className="mt-2 flex flex-wrap gap-3">
                          <ToggleGroup
                            type="single"
                            value={serviceStatuses[service.id] || service.status}
                            onValueChange={(newStatus) => handleStatusChange(service.id, newStatus)}
                            className="flex flex-wrap gap-2"
                          >
                            <ToggleGroupItem
                              value="Operational"
                              className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Operational" || (!serviceStatuses[service.id] && service.status === "Operational") ? "bg-green-700 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                            >
                              Operational
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="Degraded Performance"
                              className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Degraded Performance" || (!serviceStatuses[service.id] && service.status === "Degraded Performance") ? "bg-purple-700 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                            >
                              Degraded Performance
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="Partial Outage"
                              className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Partial Outage" || (!serviceStatuses[service.id] && service.status === "Partial Outage") ? "bg-red-600 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                            >
                              Partial Outage
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="Major Outage"
                              className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Major Outage" || (!serviceStatuses[service.id] && service.status === "Major Outage") ? "bg-red-800 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                            >
                              Major Outage
                            </ToggleGroupItem>
                          </ToggleGroup>
                          {changedServiceStatuses[service.id] && <div className='flex gap-2'> <button
                            onClick={() => handleSetStatus(service.id)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-[12px] rounded-[10px] shadow-md transition-all duration-300"
                          >
                            Update status
                          </button>
                            <button
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
                              className="px-4 py-2 bg-red-600 hover:bg-green-700 text-white text-[12px] rounded-[10px] shadow-md transition-all duration-300"
                            >
                              Discard
                            </button>
                          </div>
                          }
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
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
