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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl } from "../config/appConfig";

const user = {
    id: localStorage.getItem("userId"),
    role: localStorage.getItem('role'),
    owned_service_groups: localStorage.getItem('owned_service_groups')?.split(',')
};

const Components = () => {

    const [ownedGroupNames, setOwnedGroupNames] = useState([]);
    const [serviceName, setServiceName] = useState("");
    const [serviceStatus, setServiceStatus] = useState("");

    const [problemDescription, setProblemDescription] = useState("");
    const [problemTitle, setProblemTitle] = useState("");
    const [problemOccurredAt, setProblemOccurredAt] = useState("");
    const [problemAffectedServcie, setProblemAffectedServcie] = useState("");
    const [problemStatusContent, setProblemStatusContent] = useState("");

    const [serviceLink, setServiceLink] = useState("");
    const [maintenanceTime, setMaintenanceTime] = useState("");
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
        } catch (error) {
            console.error('Error subscribing:', error);
        }
    };

    useEffect(() => {
        fetchServices();
    }, [])

    const handleChange = (e) => {
        const newDateTime = e.target.value;
        setProblemOccurredAt(newDateTime);
    };


    const handleEditClick = async (service) => {
        setServiceName(service.name);
        setServiceStatus(service.status);
    };

    const handleSave = async (id) => {

        if (!serviceName || !serviceName) {
            alert("Service name or status cannot be empty. Please fill all the required fields.");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/services/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ name: serviceName, status: serviceName, link: serviceLink }),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Service updated successfully!');
                document.getElementById("close-dialog").click();
                fetchServices();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.log(error)
            console.error('Error Service updated failed:', error);
            alert('Error Service updated failed.');
        }
    };

    const handleReportProblem = async (e) => {
        e.preventDefault();

        if (!problemTitle || !problemDescription || !problemOccurredAt || !problemStatusContent) {
            alert('Missing required fields: title, description, status, occurred_at. Please fill all the required fields.');
            return;
        }

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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(newIncident),
            });

            const data = await response.json();
            console.log(data)
            if (response.ok) {
                alert('Incident created successfully!');
                document.getElementById("close-dialog").click();
            } else {
                alert(`${data.message}`);
            }
        } catch (error) {
            console.log(error)
            console.error('Error creating incident:', error);
            alert('Error creating incident.');
        }
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
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
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
                document.getElementById("close-dialog").click();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error creating Service maintenance scheduled:', error);
            alert('Error creating Service maintenance scheduled.');
        }
    };


    const handleCreateNewService = async () => {
        const body = { newServiceName, newServiceStatus, newGroupName, newServiceLink }

        if (!newServiceName || !newServiceStatus || !newGroupName) {
            alert("Service name or status, Group name cannot be empty. Please fill all the required fields.");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/api/services`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (response.ok) {
                alert('New service created successfully!');
                document.getElementById("close-dialog").click();
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
                    <DialogContent className="sm:max-w-[500px] bg-gray-900 text-white max-h-[90vh] overflow-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Service</DialogTitle>
                        </DialogHeader>
                        <div className=" grid gap-4 max-h-[60vh] overflow-y-auto py-4 px-3">
                            <div className="grid grid-cols-4 items-center gap-2">
                                <Label htmlFor="new-service-name" className="text-right">
                                    Service name
                                </Label>
                                <Input
                                    id="new-service-name"
                                    value={newServiceName}
                                    onChange={(e) => setNewServiceName(e.target.value)}
                                    className="col-span-3 rounded-[5px]"
                                />
                            </div>

                            <div className="grid grid-cols-4 items-center gap-3 mt-2">
                                <Label className="text-right">Service status</Label>
                                <div className="col-span-3 flex flex-wrap gap-3">
                                    <ToggleGroup
                                        type="single"
                                        value={newServiceStatus}
                                        className="flex flex-wrap gap-2"
                                    >
                                        <ToggleGroupItem
                                            value="Operational"
                                            className={`px-2 py-1 rounded-[10px] text-[12px] ${newServiceStatus === "Operational" ? "bg-green-700 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                        >
                                            Operational
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                            disabled
                                            value="Degraded Performance"
                                            className={`px-2 py-1 rounded-[10px] text-[12px]  ${newServiceStatus === "Degraded Performance" ? "bg-purple-700 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                        >
                                            Degraded
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                            disabled
                                            value="Partial Outage"
                                            className={`px-2 py-1 rounded-[10px] text-[12px]  ${newServiceStatus === "Partial Outage" ? "bg-red-600 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                        >
                                            Partial Outage
                                        </ToggleGroupItem>
                                        <ToggleGroupItem
                                            disabled
                                            value="Major Outage"
                                            className={`px-2 py-1 rounded-[10px] text-[12px] ${newServiceStatus === "Major Outage" ? "bg-red-800 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                        >
                                            Major Outage
                                        </ToggleGroupItem>
                                    </ToggleGroup>
                                </div>
                            </div>


                            <div className="grid grid-cols-4 items-center gap-2 mt-2">
                                <Label htmlFor="group-selection" className="text-right">
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
                                    className="col-span-3 text-[14px] rounded-[5px] p-1 border border-gray-300 bg-gray-900 text-white"
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
                                        className="col-span-3 rounded-[5px] mt-2"
                                    />
                                )}
                            </div>

                            <div className="grid grid-cols-4 items-center gap-2 mt-2">
                                <Label htmlFor="new-service-link" className="text-right">
                                    An optional link to the Service Link
                                </Label>
                                <Input
                                    id="new-service-link"
                                    value={newServiceLink}
                                    onChange={(e) => setNewServiceLink(e.target.value)}
                                    className="col-span-3 rounded-[5px]"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button onClick={handleCreateNewService} className="w-full rounded-[5px] py-2 text-sm">
                                Create Service
                            </Button>
                            <DialogClose asChild>
                                <button id="close-dialog" className="absolute top-3 right-6 text-white text-sm hover:rounded-full">
                                    ✕
                                </button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

            </div>}

            <table className="border-[1px] min-w-full table-auto">
                <thead>
                    <tr className="bg-gray-700 text-white">
                        <th className="px-6 py-3 text-left text-sm font-semibold">Service Name</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Group</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {ownedGroupNames.map((group) =>
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
                                    {user.role === "Admin" && <Dialog>
                                        <DialogTrigger asChild>
                                            <button onClick={() => handleEditClick(service)} className="text-blue-500 hover:text-blue-700">
                                                <Pencil size={16} />
                                            </button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[550px] bg-gray-900 text-white max-h-[90vh] overflow-auto">
                                            <DialogHeader>
                                                <DialogTitle>Edit Service</DialogTitle>
                                            </DialogHeader>
                                            <div className=" grid gap-4 max-h-[60vh] overflow-y-auto py-4 px-3">
                                                <div className="grid grid-cols-4 items-center gap-2">
                                                    <Label htmlFor="name" className="text-right">
                                                        Name
                                                    </Label>
                                                    <Input
                                                        id="name"
                                                        value={serviceName}
                                                        onChange={(e) => setServiceName(e.target.value)}
                                                        className="col-span-3 rounded-[5px]"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-4 items-center gap-2 mt-2">
                                                    <Label className="text-right">Status</Label>
                                                    <div className="col-span-3 flex flex-wrap gap-2">
                                                        <ToggleGroup
                                                            type="single"
                                                            value={serviceStatus}
                                                            onValueChange={setServiceStatus}
                                                            className="flex flex-wrap gap-2"
                                                        >
                                                            <ToggleGroupItem
                                                                value="Operational"
                                                                className={`px-2 py-1 rounded-[10px] text-sm ${serviceStatus === "Operational" ? "bg-green-700 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                            >
                                                                Operational
                                                            </ToggleGroupItem>
                                                            <ToggleGroupItem
                                                                value="Degraded Performance"
                                                                className={`px-2 py-1 rounded-[10px] text-sm ${serviceStatus === "Degraded Performance" ? "bg-purple-700 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                            >
                                                                Degraded
                                                            </ToggleGroupItem>
                                                            <ToggleGroupItem
                                                                value="Partial Outage"
                                                                className={`px-2 py-1 rounded-[10px] text-sm ${serviceStatus === "Partial Outage" ? "bg-red-600 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                            >
                                                                Partial Outage
                                                            </ToggleGroupItem>
                                                            <ToggleGroupItem
                                                                value="Major Outage"
                                                                className={`px-2 py-1 rounded-[10px] text-sm ${serviceStatus === "Major Outage" ? "bg-red-800 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                            >
                                                                Major Outage
                                                            </ToggleGroupItem>
                                                        </ToggleGroup>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-4 items-center gap-2 mt-2">
                                                    <Label htmlFor="new-service-link" className="text-right">
                                                        An optional link to the Service Link
                                                    </Label>
                                                    <Input
                                                        id="new-service-link"
                                                        value={serviceLink}
                                                        onChange={(e) => setServiceLink(e.target.value)}
                                                        className="col-span-3 rounded-[5px]"
                                                    />
                                                </div>
                                            </div>

                                            <DialogFooter>
                                                <Button onClick={() => handleSave(service.id)} className="w-full rounded-[5px] py-2 text-sm">
                                                    Save changes
                                                </Button>
                                                <DialogClose asChild>
                                                    <button id="close-dialog" className="absolute top-3 right-6 text-white text-sm hover:rounded-full">
                                                        ✕
                                                    </button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>}
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
                                                {service.status === "Operational" ? <button className="text-yellow-500 hover:text-yellow-700" onClick={() => { setProblemAffectedServcie(service.id) }}>
                                                    <AlertTriangle size={16} />
                                                </button> : <button disabled className="text-yellow-500" onClick={() => { setProblemAffectedServcie(service.id) }}>
                                                    <AlertTriangle size={16} opacity={0.56} />
                                                </button>}

                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[600px] bg-gray-900 text-white max-h-[90vh] overflow-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Report an Incident</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-5 max-h-[60vh] overflow-y-auto py-4 px-3">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="incident-title" className="text-right">Title</Label>
                                                        <Input id="incident-title" value={problemTitle} onChange={(e) => setProblemTitle(e.target.value)} />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>Describe the issue</Label>
                                                        <Textarea value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} />
                                                    </div>

                                                    <div className="grid grid-cols-4 items-center gap-2">
                                                        <Label htmlFor="incident-status-description" className="text-right">
                                                            Status description
                                                        </Label>
                                                        <Textarea
                                                            id="incident-status-description"
                                                            value={problemStatusContent}
                                                            onChange={(e) => setProblemStatusContent(e.target.value)}
                                                            className="col-span-3 rounded-[5px]"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-4 items-center gap-2">
                                                        <Label htmlFor="incident-time" className="text-right">
                                                            Reported On
                                                        </Label>
                                                        <Input
                                                            id="incident-occured-at"
                                                            value={problemOccurredAt ? problemOccurredAt.slice(0, 16) : ''}
                                                            onChange={handleChange}
                                                            className="col-span-3 rounded-[5px]"
                                                            type="datetime-local"
                                                        />
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={handleReportProblem} className="w-full rounded-[5px] py-2 text-sm">Submit</Button>
                                                    <DialogClose asChild>
                                                        <button id="close-dialog" className="absolute top-3 right-6 text-white text-sm hover:rounded-full">
                                                            ✕
                                                        </button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}

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
                                                    ? <button className="text-green-500 hover:text-green-700"> <CalendarClock size={16} /> </button> :
                                                    <button disabled className="text-red-500 hover:text-red-700">   <CalendarMinus size={16} /> </button>}
                                            </DialogTrigger>
                                            <DialogContent className="sm:max-w-[600px] bg-gray-900 text-white max-h-[90vh] overflow-auto">
                                                <DialogHeader>
                                                    <DialogTitle>Schedule Maintenance</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid gap-5 max-h-[60vh] overflow-y-auto py-4 px-3">
                                                    <div className="grid grid-cols-4 items-center gap-2">
                                                        <Label htmlFor="maintenance-title" className="text-right">
                                                            Title
                                                        </Label>
                                                        <Input
                                                            id="maintenance-title"
                                                            value={maintenanceTitle}
                                                            onChange={(e) => setMaintenanceTitle(e.target.value)}
                                                            className="col-span-3 rounded-[5px]"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-4 items-center gap-2">
                                                        <Label htmlFor="maintenance-description" className="text-right">
                                                            Description
                                                        </Label>
                                                        <Textarea
                                                            id="maintenance-description"
                                                            value={maintenanceDescription}
                                                            onChange={(e) => setMaintenanceDescription(e.target.value)}
                                                            className="col-span-3 rounded-[5px]"
                                                        />
                                                    </div>


                                                    <div className="grid grid-cols-4 items-center gap-2">
                                                        <Label htmlFor="maintenance-status-description" className="text-right">
                                                            Status description
                                                        </Label>
                                                        <Textarea
                                                            id="maintenance-status-description"
                                                            value={maintenanceStatusContent}
                                                            onChange={(e) => setMaintenanceStatusContent(e.target.value)}
                                                            className="col-span-3 rounded-[5px]"
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-4 items-center gap-3">
                                                        <div>
                                                            <Label htmlFor="maintenance-scheduled-start" className="text-right">
                                                                Scheduled Start
                                                            </Label>
                                                            <Input
                                                                id="maintenance-scheduled-start"
                                                                value={maintenanceScheduledStart}
                                                                onChange={(e) => setMaintenanceScheduledStart(e.target.value)}
                                                                className="col-span-3 rounded-[5px]"
                                                                type="datetime-local"
                                                            />
                                                        </div>

                                                        <div>
                                                            <Label htmlFor="maintenance-scheduled-end" className="text-right">
                                                                Scheduled End
                                                            </Label>
                                                            <Input
                                                                disabled={["Completed", "Canceled"].includes(maintenanceStatus)}
                                                                id="maintenance-scheduled-end"
                                                                value={maintenanceScheduledEnd}
                                                                onChange={(e) => setMaintenanceScheduledEnd(e.target.value)}
                                                                className="col-span-3 rounded-[5px]"
                                                                type="datetime-local"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-4 items-center gap-3">
                                                        <Label className="text-right">Change service status</Label>
                                                        <div className="col-span-3 flex flex-wrap gap-2">
                                                            <ToggleGroup
                                                                type="single"
                                                                value={serviceStatuses[service.id]}
                                                                onValueChange={(newStatus) => handleStatusChange(service.id, newStatus)}
                                                                className="flex flex-wrap gap-2"
                                                            >
                                                                <ToggleGroupItem
                                                                    disabled
                                                                    value="Operational"
                                                                    className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Operational" ? "bg-green-700 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                                >
                                                                    Operational
                                                                </ToggleGroupItem>
                                                                <ToggleGroupItem
                                                                    value="Degraded Performance"
                                                                    className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Degraded Performance" ? "bg-purple-700 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                                >
                                                                    Degraded Performance
                                                                </ToggleGroupItem>
                                                                <ToggleGroupItem
                                                                    value="Partial Outage"
                                                                    className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Partial Outage" ? "bg-red-600 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                                >
                                                                    Partial Outage
                                                                </ToggleGroupItem>
                                                                <ToggleGroupItem
                                                                    value="Major Outage"
                                                                    className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[service.id] === "Major Outage" ? "bg-red-800 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                                >
                                                                    Major Outage
                                                                </ToggleGroupItem>
                                                            </ToggleGroup>
                                                        </div>

                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={() => handleScheduleMaintenance(service.id, service.status)} className="w-full rounded-[5px] py-2 text-sm">Schedule</Button>
                                                    <DialogClose asChild>
                                                        <button id="close-dialog" className="absolute top-3 right-6 text-white text-sm hover:rounded-full">
                                                            ✕
                                                        </button>
                                                    </DialogClose>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    )}

                                    {user.role === "Admin" && <button className="text-red-500 hover:text-red-700">
                                        <Trash size={16} />
                                    </button>}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
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
