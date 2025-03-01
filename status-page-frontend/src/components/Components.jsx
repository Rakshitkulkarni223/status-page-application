import React, { useEffect, useState } from "react";
import { Pencil, Trash, AlertTriangle, CalendarClock, PlusCircle, CalendarMinus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl } from "../config/appConfig";
import { useAuth } from "../contexts/authContext";
import { useSocket } from "../contexts/socketContext";
import Loader from "./Loader";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";


const Components = () => {

    const { user, token } = useAuth();
    const { socket } = useSocket();

    const [loading, setLoading] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const [ownedGroupNames, setOwnedGroupNames] = useState([]);
    const [serviceName, setServiceName] = useState("");
    const [serviceStatus, setServiceStatus] = useState("");

    const [problemDescription, setProblemDescription] = useState("");
    const [problemTitle, setProblemTitle] = useState("");
    const [problemOccurredAt, setProblemOccurredAt] = useState("");
    const [problemAffectedServcie, setProblemAffectedServcie] = useState("");
    const [problemStatusContent, setProblemStatusContent] = useState("");

    const [serviceLink, setServiceLink] = useState("");
    const [newServiceName, setNewServiceName] = useState("");
    const [newGroupName, setNewGroupName] = useState("");
    const [newServiceStatus, setNewServiceStatus] = useState("Operational");
    const [newServiceLink, setNewServiceLink] = useState("");

    const [maintenanceTitle, setMaintenanceTitle] = useState("");
    const [maintenanceStatus, setMaintenanceStatus] = useState("");
    const [maintenanceDescription, setMaintenanceDescription] = useState("");
    const [maintenanceScheduledStart, setMaintenanceScheduledStart] = useState("");
    const [maintenanceScheduledEnd, setMaintenanceScheduledEnd] = useState("");
    const [maintenanceStatusContent, setMaintenanceStatusContent] = useState("");

    const [serviceStatuses, setServiceStatuses] = useState({});

    const handleStatusChange = (incidentId, newStatus) => {
        setServiceStatuses((prevStatuses) => ({
            ...prevStatuses,
            [incidentId]: newStatus,
        }));
    };

    const [isOtherSelected, setIsOtherSelected] = useState(false);

    const fetchServices = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/services`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            setOwnedGroupNames(user.role === "Admin" ? data : data
                .filter(group => user.owned_service_groups.includes(group.id)))

            setIsLoading(false);
        } catch (error) {
            alert(error)
            setIsLoading(false);
            console.error('Error subscribing:', error);
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
                setOwnedGroupNames((prevGroups) => {
                    return (user.role === "Admin"
                        ? prevGroups
                        : prevGroups.filter(group => user.owned_service_groups.includes(group.id))
                    ).map((group) => {
                        var updatedServices = group.services.map((service) => {
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

                        updatedServices = updatedServices.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

                        return {
                            ...group,
                            services: updatedServices
                        };
                    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                });
            } else if (data.type === "CREATE_NEW_SERVICE") {
                fetchServices();
            } else if (data.type === "GROUP_NAME_UPDATE") {
                setOwnedGroupNames((prevGroups) => {
                    return (user.role === "Admin"
                        ? prevGroups
                        : prevGroups.filter(group => user.owned_service_groups.includes(group.id))
                    ).map((group) => {
                        if (group.id === data.updatedService._id) {
                            return {
                                ...group,
                                name: data.updatedService.name,
                                services: group.services
                            };
                        }
                        return group;
                    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                });
            }
        };

        return () => {
            socket.onmessage = null;
        };
    }, [socket]);

    const handleChange = (e) => {
        const newDateTime = e.target.value;
        setProblemOccurredAt(newDateTime);
    };

    const handleEditClick = async (service) => {
        setServiceName(service.name);
        setServiceStatus(service.status);
        setServiceLink(service.link);
    };

    const handleSave = async (id) => {

        if (!serviceName || !serviceStatus) {
            alert("Service name or status cannot be empty. Please fill all the required fields.");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${apiUrl}/api/services/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: serviceName, status: serviceStatus, link: serviceLink }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Service updated successfully!');
                fetchServices();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error Service updated failed:', error);
            alert('Error Service updated failed.');
        }
        setLoading(false);
    };

    const handleReportProblem = async (e) => {
        e.preventDefault();


        if (!problemTitle || !problemDescription || !problemOccurredAt || !problemStatusContent) {
            alert('Missing required fields for Title, Description, Status description, Reported on fields. Please fill all the required fields.');
            return;
        }
        setLoading(true);

        const newIncident = {
            title: problemTitle,
            description: problemDescription,
            status: "Reported",
            affected_services: problemAffectedServcie,
            occurred_at: problemOccurredAt,
            reported_by: user.id,
            timeline: [{ status: "Reported", content: problemStatusContent }],
        };

        try {
            const response = await fetch(`${apiUrl}/api/incidents`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(newIncident),
            });

            const data = await response.json();
            if (response.ok) {
                alert('Incident created successfully!');
            } else {
                alert(`${data.message}`);
            }
        } catch (error) {
            console.error('Error creating incident:', error);
            alert('Error creating incident.');
        }

        setLoading(false);
    };

    const handleScheduleMaintenance = async (id, status) => {

        if (!maintenanceTitle || !maintenanceDescription || !maintenanceScheduledStart || !maintenanceScheduledEnd || !maintenanceStatusContent) {
            alert("Maintenance title, description, status content, start date or end date cannot be empty. Please fill all the required fields.");
            return;
        }

        let updatedStatus = status;

        if (status === "Operational" && !serviceStatuses[id]) {
            alert("Please select the service status.");
            return;
        } else if (!serviceStatuses[id]) {
            alert("Please select the service status.");
            return;
        } else {
            updatedStatus = serviceStatuses[id];
        }
        setLoading(true);
        const maintenanceData = {
            title: maintenanceTitle,
            description: maintenanceDescription,
            status: "Scheduled",
            affected_services: id,
            scheduled_start: maintenanceScheduledStart,
            scheduled_end: maintenanceScheduledEnd,
            serviceStatus: updatedStatus,
            timeline: [{ status: "Scheduled", content: maintenanceStatusContent }],
        }
        try {
            const response = await fetch(`${apiUrl}/api/maintenance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(maintenanceData),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Service maintenance scheduled successfully!');
                setMaintenanceTitle('');
                setMaintenanceDescription('');
                setMaintenanceScheduledStart('');
                setMaintenanceScheduledEnd('');
                setServiceStatuses({});
                fetchServices();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error creating Service maintenance scheduled:', error);
            alert('Error creating Service maintenance scheduled.');
        }
        setLoading(false);
    };


    const handleCreateNewService = async () => {
        const body = { newServiceName, newServiceStatus, newGroupName, newServiceLink }

        if (!newServiceName || !newServiceStatus || !newGroupName) {
            alert("Service name or status, Group name cannot be empty. Please fill all the required fields.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${apiUrl}/api/services`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                alert('New service created successfully!');
                setNewServiceName('');
                setNewGroupName('');
                setNewServiceLink('');
                setNewServiceStatus('Operational');
                setIsOtherSelected(false);
                fetchServices();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error creating new service: ', error);
            alert('Error creating new service.');
        }
        setLoading(false);
    };

    const statusPriority = [
        "Operational",
        "Degraded Performance",
        "Partial Outage",
        "Major Outage"
    ];

    const [sortConfig, setSortConfig] = useState({ key: "", direction: "asc" });

    const handleSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

    const sortedGroups = ownedGroupNames.map(group => ({
        ...group,
        services: [...(group.services || [])].sort((a, b) => {
            const indexA = statusPriority.indexOf(a.status);
            const indexB = statusPriority.indexOf(b.status);
            return sortConfig.direction === "asc" ? indexA - indexB : indexB - indexA;
        })
    }));

    const finalSortedGroups = sortedGroups.sort((a, b) => {
        const highestStatusA = Math.min(...a.services.map(service => statusPriority.indexOf(service.status)));
        const highestStatusB = Math.min(...b.services.map(service => statusPriority.indexOf(service.status)));

        return sortConfig.direction === "asc" ? highestStatusA - highestStatusB : highestStatusB - highestStatusA;
    });

    const renderSortIcon = (key) => {
        if (sortConfig.key !== key) return <ArrowUpDown className="inline ml-2 w-4 h-4" />;
        return sortConfig.direction === "asc" ? (
            <ArrowUp className="inline ml-2 w-4 h-4" />
        ) : (
            <ArrowDown className="inline ml-2 w-4 h-4" />
        );
    };


    return (
        <div className="rounded-b-[10px]">

            {user.role === "Admin" && <div className="flex justify-end mb-4">
                <Dialog onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setNewServiceName('');
                        setNewGroupName('');
                        setNewServiceLink('');
                        setNewServiceStatus('Operational');
                        setIsOtherSelected(false);
                    }
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-green-700 hover:bg-green-800 text-white">
                            <PlusCircle size={16} className="mr-2" />
                            New Service
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] bg-gray-900 flex flex-col text-white max-h-[80vh] overflow-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Service</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-5 items-start max-h-[60vh] overflow-y-auto py-4">
                            <div className="flex flex-col items-start gap-2">
                                <Label htmlFor="new-service-name" className="text-left">
                                    Service name
                                </Label>
                                <Input
                                    id="new-service-name"
                                    value={newServiceName}
                                    onChange={(e) => setNewServiceName(e.target.value)}
                                    className="w-96 rounded-[5px]"
                                />
                            </div>

                            <div className="flex flex-col items-start gap-2">
                                <Label className="text-left">Status</Label>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        value="Operational"
                                        className={`px-2 py-1 rounded-[10px] text-[12px] ${newServiceStatus === "Operational" ? "bg-green-700 text-white  hover:bg-green-800" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                    >
                                        Operational
                                    </Button>
                                    <Button
                                        disabled
                                        value="Degraded Performance"
                                        className={`px-2 py-1 rounded-[10px] text-[12px]  bg-gray-800 text-gray-300`}
                                    >
                                        Degraded Performance
                                    </Button>
                                    <Button
                                        disabled
                                        value="Partial Outage"
                                        className={`px-2 py-1 rounded-[10px] text-[12px]  bg-gray-800 text-gray-300`}
                                    >
                                        Partial Outage
                                    </Button>
                                    <Button
                                        disabled
                                        value="Major Outage"
                                        className={`px-2 py-1 rounded-[10px] text-[12px]  bg-gray-800 text-gray-300`}
                                    >
                                        Major Outage
                                    </Button>
                                </div>
                            </div>


                            <div className="flex flex-col items-start gap-2">
                                <Label htmlFor="group-selection" className="text-left">
                                    Group name
                                </Label>

                                <select
                                    id="group-selection"
                                    value={isOtherSelected ? "other" : newGroupName}
                                    onChange={(e) => {
                                        if (e.target.value === "other") {
                                            setIsOtherSelected(true);
                                            setNewGroupName("");
                                        } else {
                                            setIsOtherSelected(false);
                                            setNewGroupName(e.target.value);
                                        }
                                    }}
                                    className="flex-1 text-[14px] rounded-[5px] p-1 border border-gray-300 bg-gray-900 text-white"
                                >
                                    <option value="" disabled>Select a group</option>
                                    {ownedGroupNames.map((group) => (
                                        <option key={group.id} value={group.name}>
                                            {group.name}
                                        </option>
                                    ))}
                                    <option value="other">Other</option>
                                </select>

                                {isOtherSelected && (
                                    <Input
                                        id="new-service-name"
                                        placeholder="Enter new group name"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="w-96 rounded-[5px]"
                                    />
                                )}
                            </div>

                            <div className="flex flex-col items-start gap-2">
                                <Label htmlFor="new-service-link" className="text-left">
                                    An optional link to the Service Link
                                </Label>
                                <Input
                                    id="new-service-link"
                                    value={newServiceLink}
                                    onChange={(e) => setNewServiceLink(e.target.value)}
                                    className="w-96 rounded-[5px]"
                                />
                            </div>
                        </div>

                        <DialogFooter className="flex items-end space-x-4">
                            <Button disabled={loading} onClick={handleCreateNewService} className="border-[1px] text-black bg-green-500 rounded-[5px] py-2 text-sm hover:bg-green-600">
                                {!loading ? "Create Service" : "Creating..."}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>}

            {isLoading ? <Loader loaderText="Fetching services..." /> : ownedGroupNames?.length > 0 ? <table className="border-[1px] min-w-full table-auto">
                <thead>
                    <tr className="bg-gray-700 text-white">
                        <th onClick={() => handleSort("name")} className="px-6 py-3 text-left text-sm font-semibold cursor-pointer">
                            Service Name
                        </th>
                        <th onClick={() => handleSort("status")} className="px-6 py-3 text-left text-sm font-semibold cursor-pointer">
                            Status {renderSortIcon("status")}
                        </th>
                        <th onClick={() => handleSort("group")} className="px-6 py-3 text-left text-sm font-semibold cursor-pointer">
                            Group
                        </th>
                        <th className="px-8 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {finalSortedGroups.map((group) =>
                        group.services.map((service) => (
                            <tr key={service.id} className="border-t hover:bg-gray-800">
                                <td className="px-6 py-3 text-sm">{service.name}</td>
                                <td className="px-6 py-3 text-sm">
                                    <span className={`px-2 py-1 text-[12px] rounded-[5px] ${getStatusClass(service.status)}`}>
                                        {service.status}
                                    </span>
                                </td>
                                <td className="px-6 py-3 text-sm">{group.name}</td>
                                <td className="px-6 py-3 flex space-x-3">
                                    {user.role === "Admin" &&
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button onClick={() => handleEditClick(service)} className="bg-transparent text-blue-500 hover:text-blue-700">
                                                    <Pencil size={16} />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[560px] bg-gray-900 flex flex-col text-white max-h-[80vh] overflow-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Edit Service</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex flex-col gap-5 items-start max-h-[60vh] overflow-y-auto py-4">
                                                    <div className="flex flex-col items-start gap-2">
                                                        <Label htmlFor="name" className="text-left">
                                                            Name
                                                        </Label>
                                                        <Input
                                                            id="name"
                                                            value={serviceName}
                                                            onChange={(e) => setServiceName(e.target.value)}
                                                            className="w-96 rounded-[5px]"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col items-start gap-2">
                                                        <Label className="text-left">Status</Label>
                                                        <div className="flex flex-row gap-2">
                                                            <Button
                                                                onClick={() => setServiceStatus("Operational")}
                                                                className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatus === "Operational" ? "bg-green-700 text-white  hover:bg-green-800" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                            >
                                                                Operational
                                                            </Button>
                                                            <Button
                                                                onClick={() => setServiceStatus("Degraded Performance")}
                                                                className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatus === "Degraded Performance" ? "bg-purple-700 text-white  hover:bg-purple-800" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                            >
                                                                Degraded Performance
                                                            </Button>
                                                            <Button
                                                                onClick={() => setServiceStatus("Partial Outage")}
                                                                className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatus === "Partial Outage" ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                            >
                                                                Partial Outage
                                                            </Button>
                                                            <Button
                                                                onClick={() => setServiceStatus("Major Outage")}
                                                                className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatus === "Major Outage" ? "bg-red-800 text-white hover:bg-red-900" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                            >
                                                                Major Outage
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-start gap-2">
                                                        <Label htmlFor="new-service-link" className="text-left">
                                                            An optional link to the Service Link
                                                        </Label>
                                                        <Input
                                                            id="new-service-link"
                                                            value={serviceLink}
                                                            onChange={(e) => setServiceLink(e.target.value)}
                                                            className="w-96 rounded-[5px]"
                                                        />
                                                    </div>
                                                </div>

                                                <DialogFooter className="flex items-end space-x-4">
                                                    <Button disabled={loading} onClick={() => handleSave(service.id)} className="border-[1px] text-black bg-green-500 rounded-[5px] py-2 text-sm hover:bg-green-600">
                                                        {!loading ? "Save changes" : "Saving..."}
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>}

                                    {user.role === "Admin" && (
                                        <Dialog onOpenChange={(isOpen) => {
                                            if (!isOpen) {
                                                setMaintenanceTitle('');
                                                setMaintenanceDescription('');
                                                setMaintenanceScheduledStart('');
                                                setMaintenanceScheduledEnd('');
                                                setMaintenanceStatusContent('');
                                                setServiceStatuses({});
                                            }
                                        }}>
                                            <DialogTrigger asChild>
                                                {!service.maintenanceScheduled
                                                    ? <Button className="bg-transparent text-green-500 hover:text-green-700"> <CalendarClock size={16} /> </Button> :
                                                    <Button disabled className="bg-transparent text-red-500 hover:text-red-700">   <CalendarMinus size={16} /> </Button>}
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[600px] bg-gray-900 text-white max-h-[90vh] overflow-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Schedule Maintenance</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex flex-col gap-5 items-start max-h-[60vh] overflow-y-auto py-4">
                                                    <div className="flex flex-col items-start gap-2">
                                                        <Label htmlFor="maintenance-title" className="text-left">
                                                            Title
                                                        </Label>
                                                        <Input
                                                            id="maintenance-title"
                                                            value={maintenanceTitle}
                                                            onChange={(e) => setMaintenanceTitle(e.target.value)}
                                                            className="w-96 rounded-[5px]"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col items-start gap-2">
                                                        <Label htmlFor="maintenance-description" className="text-left">
                                                            Description
                                                        </Label>
                                                        <Textarea
                                                            id="maintenance-description"
                                                            value={maintenanceDescription}
                                                            onChange={(e) => setMaintenanceDescription(e.target.value)}
                                                            className="w-96 rounded-[5px]"
                                                        />
                                                    </div>


                                                    <div className="flex flex-col items-start gap-2">
                                                        <Label htmlFor="maintenance-status-description" className="text-left">
                                                            Status description
                                                        </Label>
                                                        <Textarea
                                                            id="maintenance-status-description"
                                                            value={maintenanceStatusContent}
                                                            onChange={(e) => setMaintenanceStatusContent(e.target.value)}
                                                            className="w-96 rounded-[5px]"
                                                        />
                                                    </div>

                                                    <div className="flex flex-row items-start gap-3">
                                                        <div>
                                                            <Label htmlFor="maintenance-scheduled-start" className="text-left">
                                                                Scheduled Start
                                                            </Label>
                                                            <Input
                                                                id="maintenance-scheduled-start"
                                                                value={maintenanceScheduledStart}
                                                                onChange={(e) => setMaintenanceScheduledStart(e.target.value)}
                                                                className="w-50 rounded-[5px]"
                                                                type="datetime-local"
                                                                min={new Date().toISOString().slice(0, 16)}
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label htmlFor="maintenance-scheduled-end" className="text-left">
                                                                Scheduled End
                                                            </Label>
                                                            <Input
                                                                disabled={["Completed", "Canceled"].includes(maintenanceStatus)}
                                                                id="maintenance-scheduled-end"
                                                                value={maintenanceScheduledEnd}
                                                                onChange={(e) => setMaintenanceScheduledEnd(e.target.value)}
                                                                className="w-50 rounded-[5px]"
                                                                type="datetime-local"
                                                                min={new Date().toISOString().slice(0, 16)}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-start gap-2">
                                                        <Label className="text-[14px]">Change service status</Label>
                                                        <div className="flex flex-row gap-2">
                                                            <Button
                                                                disabled
                                                                onClick={() => handleStatusChange(service.id, "Operational")}
                                                                className={`px-2 py-1 rounded-[10px] text-[12px]  bg-gray-800 text-gray-300`}
                                                            >
                                                                Operational
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleStatusChange(service.id, "Degraded Performance")}
                                                                className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Degraded Performance" ? "bg-purple-700 text-white hover:bg-purple-800" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                            >
                                                                Degraded Performance
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleStatusChange(service.id, "Partial Outage")}
                                                                className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Partial Outage" ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                            >
                                                                Partial Outage
                                                            </Button>
                                                            <Button
                                                                onClick={() => handleStatusChange(service.id, "Major Outage")}
                                                                className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Major Outage" ? "bg-red-800 text-white hover:bg-red-900" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                            >
                                                                Major Outage
                                                            </Button>
                                                        </div>

                                                    </div>
                                                </div>
                                                <DialogFooter className="flex items-end space-x-4">
                                                    <Button disabled={loading} onClick={() => handleScheduleMaintenance(service.id, service.status)} className="border-[1px] text-black bg-green-500 rounded-[5px] py-2 text-sm hover:bg-green-600">{!loading ? "Schedule" : "Scheduling..."}</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}

                                    {user.role !== "Admin" && (
                                        <Dialog onOpenChange={(isOpen) => {
                                            if (!isOpen) {
                                                setProblemAffectedServcie('');
                                                setProblemDescription('');
                                                setProblemOccurredAt('');
                                                setProblemStatusContent('');
                                                setProblemTitle('');
                                            }
                                        }}>
                                            <DialogTrigger asChild>
                                                {service.status === "Operational" ? <Button className="bg-transparent text-yellow-500 hover:text-yellow-700" onClick={() => { setProblemAffectedServcie(service.id) }}>
                                                    <AlertTriangle size={16} />
                                                </Button> : <Button disabled className="bg-transparent text-yellow-500" onClick={() => { setProblemAffectedServcie(service.id) }}>
                                                    <AlertTriangle size={16} opacity={0.56} />
                                                </Button>}

                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[650px] bg-gray-900 flex flex-col text-white max-h-[80vh] overflow-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Report an Incident</DialogTitle>
                                                </DialogHeader>
                                                <div className="flex flex-col gap-4 items-start max-h-[60vh] overflow-y-auto py-4">
                                                    <div className="flex flex-col items-start gap-2">
                                                        <Label htmlFor="incident-title" className="text-left">Title</Label>
                                                        <Input id="incident-title" className="w-64 rounded-[5px]" value={problemTitle} onChange={(e) => setProblemTitle(e.target.value)} />
                                                    </div>
                                                    <div className="flex flex-col items-start gap-2">
                                                        <Label>Describe the issue</Label>
                                                        <Textarea value={problemDescription} className="w-96 rounded-[5px]" onChange={(e) => setProblemDescription(e.target.value)} />
                                                    </div>

                                                    <div className="flex flex-col items-start gap-2">
                                                        <Label htmlFor="incident-status-description" className="text-left">
                                                            Status description
                                                        </Label>
                                                        <Textarea
                                                            id="incident-status-description"
                                                            value={problemStatusContent}
                                                            onChange={(e) => setProblemStatusContent(e.target.value)}
                                                            className="w-96 rounded-[5px]"
                                                        />
                                                    </div>

                                                    <div className="flex flex-col items-start gap-2">
                                                        <Label htmlFor="incident-time" className="text-left">
                                                            Occurred On
                                                        </Label>
                                                        <Input
                                                            id="incident-occured-at"
                                                            value={problemOccurredAt ? problemOccurredAt.slice(0, 16) : ''}
                                                            onChange={handleChange}
                                                            className="rounded-[5px]"
                                                            type="datetime-local"
                                                            max={new Date().toISOString().slice(0, 16)}
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter className="flex items-end space-x-4">
                                                    <Button disabled={loading} onClick={handleReportProblem} className="border-[1px] text-black bg-green-500 rounded-[5px] py-2 text-sm hover:bg-green-600">{!loading ? "Report" : "Reporting..."}</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table> : <div className='flex flex-col gap-3'>
                <p className='p-2 bg-gray-800 rounded-[5px] border-[1px] border-gray-600 text-left'>{user.role === "Admin" ? "No services found." : "You haven't subscribed to any services yet."}</p>
            </div>}
        </div>
    );
};

const getStatusClass = (status) => {
    switch (status) {
        case "Operational":
            return "bg-green-700 text-white";
        case "Degraded Performance":
            return "bg-purple-700 text-white";
        case "Partial Outage":
            return "bg-red-600 text-white";
        case "Major Outage":
            return "bg-red-800 text-white";
        default:
            return "bg-gray-500 text-white";
    }
};

export default Components;
