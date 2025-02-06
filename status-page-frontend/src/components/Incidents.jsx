import React, { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { apiUrl } from "../config/appConfig";
import { useAuth } from "../contexts/authContext";
import { useSocket } from "../contexts/socketContext";


const Incidents = () => {
    const { user, token } = useAuth();

    const { socket } = useSocket();

    const [incidentTitle, setIncidentTitle] = useState("");
    const [incidentStatus, setIncidentStatus] = useState("");
    const [incidentDescription, setIncidentDescription] = useState("");
    const [incidentContent, setIncidentContent] = useState("");

    const [serviceStatuses, setServiceStatuses] = useState({});


    const handleStatusChange = (incidentId, newStatus) => {
        setServiceStatuses((prevStatuses) => ({
            ...prevStatuses,
            [incidentId]: newStatus,
        }));
    };

    const handleEditClick = async (incident) => {
        setIncidentTitle(incident.title);
        setIncidentStatus(incident.status);
        setIncidentDescription(incident.description);
        setIncidentContent(incident.content || "");
        setServiceStatuses((prevStatuses) => ({
            ...prevStatuses,
            [incident._id]: incident.affected_services.status,
        }));
    };

    const handleSave = async (e, incidentId) => {
        e.preventDefault();
        let serviceStatus = serviceStatuses[incidentId];

        if (!incidentStatus || !serviceStatus || !incidentContent) {
            alert("Incident status, content or service status cannnot be empty. Please fill all the required fields.");
            return;
        }

        if (incidentStatus === "Identified" || incidentStatus === "Monitoring") {
            if (serviceStatus === "Operational") {
                alert("When an incident is in Identified or Monitoring state then service cannnot be Operational. Please change the service status.");
                return;
            }
        }

        if (incidentStatus === "Fixed") {
            alert("When an incident is Fixed service status will be set to Operational.");
            serviceStatus = "Operational";
        }

        const updatedIncident = {
            status: incidentStatus,
            serviceStatus,
            timeline: incidentStatus !== 'Reported' ? [{ status: incidentStatus, content: incidentContent }] : [],
        };

        try {
            const response = await fetch(`${apiUrl}/api/incidents/${incidentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedIncident),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Incident updated successfully!');
                document.getElementById("close-dialog").click();
                fetchIncidents();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error updating incident:', error);
            alert('Error updating incident.');
        }
    };

    const statusOptions = ["Reported", "Investigating", "Identified", "Monitoring", "Fixed"];

    const [filteredIncidents, setFilteredIncidents] = useState([]);

    const [incidents, setIncidents] = useState([]);

    const fetchIncidents = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/incidents`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            setFilteredIncidents(user.role === "Admin" ? data : data.filter(
                (incident) => incident.reported_by === user.id
            ));
            setIncidents(data);
        } catch (error) {
            console.error('Error subscribing:', error);
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, [])


    useEffect(() => {
        if (!socket) return;

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "REPORT_NEW_INCIDENT") {
                setFilteredIncidents((prev) => {
                    return (
                        user.role === "Admin"
                            ? [...prev, data.incident]
                            : [...prev.filter(incident => incident.reported_by === user.id), data.incident]
                    )
                })
            }else if(data.type === "UPDATE_INCIDENT"){
                setFilteredIncidents((prev) => {
                    return (
                        user.role === "Admin"
                            ? prev
                            : prev.filter(incident => incident.reported_by === user.id)
                    ).map((incidentItem) => {
                        if(incidentItem._id === data.incident._id){
                            return {
                                ...data.incident
                            }
                        }
                        return {
                            ...incidentItem
                        };
                    })
                })
            }
        };

        return () => {
            socket.onmessage = null;
        };
    }, [socket]);


    return (
        <div className="rounded-b-[10px]">
            <table className="border-[1px] min-w-full table-auto">
                <thead>
                    <tr className="bg-gray-700 text-white">
                        <th className="px-6 py-3 text-left text-sm font-semibold">Incident Title</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Reported On</th>
                        {user.role === "Admin" && <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {filteredIncidents.map((incident) => (
                        <tr key={incident._id} className="border-t hover:bg-gray-800">
                            <td className="px-6 py-3 text-sm">{incident.title}</td>
                            <td className="px-6 py-3 text-sm">
                                <span className={`px-2 py-1 text-[12px] rounded-[5px] ${getStatusClass(incident.status)}`}>
                                    {incident.status}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-sm">{incident.occurred_at}</td>
                            {user.role === "Admin" && <td className="px-6 py-3 flex space-x-3">

                                <Dialog onOpenChange={(isOpen) => {
                                    if (!isOpen) {
                                        setIncidentContent('');
                                        setIncidentDescription('');
                                        setIncidentStatus('');
                                        setIncidentTitle('');
                                        setServiceStatuses({});
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        <button onClick={() => handleEditClick(incident)} className="text-blue-500 hover:text-blue-700">
                                            <Pencil size={16} />
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[700px] bg-gray-900 text-white max-h-[80vh] overflow-auto">
                                        <DialogHeader>
                                            <DialogTitle>Edit Incident</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 max-h-[60vh] overflow-y-auto py-4 px-3">
                                            <div className="grid grid-cols-4 items-center gap-2">
                                                <Label htmlFor="incident-title" className="text-right">
                                                    Title
                                                </Label>
                                                <Input
                                                    disabled
                                                    id="incident-title"
                                                    value={incidentTitle}
                                                    onChange={(e) => setIncidentTitle(e.target.value)}
                                                    className="col-span-3 rounded-[5px]"
                                                />
                                            </div>

                                            <div className="grid grid-cols-4 items-center gap-2">
                                                <Label className="text-right">Status</Label>
                                                <div className="col-span-3 flex flex-wrap gap-2">
                                                    {statusOptions.map((status) => (
                                                        <Button
                                                            disabled={(user.role === "Admin" && status === "Reported")}
                                                            key={status}
                                                            onClick={() => {
                                                                if (status === "Fixed") {
                                                                    handleStatusChange(incident._id, "Operational")
                                                                } else if (["Identified", "Monitoring"].includes(status) && serviceStatuses[incident._id] && serviceStatuses[incident._id] === "Operational") {
                                                                    handleStatusChange(incident._id, "");
                                                                }
                                                                setIncidentStatus(status);
                                                            }
                                                            }
                                                            className={incidentStatus === status ? "rounded-[10px] bg-blue-500" : "rounded-[10px] bg-gray-500"}
                                                        >
                                                            {status}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 items-center gap-2">
                                                <Label htmlFor="incident-status-description" className="text-right">
                                                    Status description
                                                </Label>
                                                <Textarea
                                                    id="incident-status-description"
                                                    value={incidentContent}
                                                    onChange={(e) => setIncidentContent(e.target.value)}
                                                    className="col-span-3 rounded-[5px]"
                                                />
                                            </div>


                                            <div className="grid grid-cols-4 items-center gap-2">
                                                <Label htmlFor="incident-description" className="text-right">
                                                    Description
                                                </Label>
                                                <Textarea
                                                    disabled
                                                    id="incident-description"
                                                    value={incidentDescription}
                                                    onChange={(e) => setIncidentDescription(e.target.value)}
                                                    className="col-span-3 rounded-[5px]"
                                                />
                                            </div>

                                            <div className="grid grid-cols-4 items-center gap-2">
                                                <Label htmlFor="incident-time" className="text-right">
                                                    Reported On
                                                </Label>
                                                <Input
                                                    disabled
                                                    id="incident-occured-at"
                                                    value={incident.occurred_at.replace('Z', '').slice(0, 16)}
                                                    className="col-span-3 rounded-[5px]"
                                                    type="datetime-local"
                                                />
                                            </div>

                                            {incidentStatus && <div className="grid grid-cols-4 items-center gap-2">
                                                <p className="text-[15px]">Change service status</p>
                                                <ToggleGroup
                                                    id="incident-status-description"
                                                    type="single"
                                                    value={serviceStatuses[incident._id]}
                                                    onValueChange={(newStatus) => handleStatusChange(incident._id, newStatus)}
                                                    className="flex flex-wrap gap-2"
                                                >
                                                    <ToggleGroupItem
                                                        disabled={["Identified", "Monitoring"].includes(incidentStatus)}
                                                        value="Operational"
                                                        className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[incident._id] === "Operational" ? "bg-green-700 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                    >
                                                        Operational
                                                    </ToggleGroupItem>
                                                    <ToggleGroupItem
                                                        disabled={incidentStatus === "Fixed"}
                                                        value="Degraded Performance"
                                                        className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[incident._id] === "Degraded Performance" ? "bg-purple-700 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                    >
                                                        Degraded Performance
                                                    </ToggleGroupItem>
                                                    <ToggleGroupItem
                                                        disabled={incidentStatus === "Fixed"}
                                                        value="Partial Outage"
                                                        className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[incident._id] === "Partial Outage" ? "bg-red-600 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                    >
                                                        Partial Outage
                                                    </ToggleGroupItem>
                                                    <ToggleGroupItem
                                                        disabled={incidentStatus === "Fixed"}
                                                        value="Major Outage"
                                                        className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[incident._id] === "Major Outage" ? "bg-red-800 text-white" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                    >
                                                        Major Outage
                                                    </ToggleGroupItem>
                                                </ToggleGroup>
                                            </div>}

                                        </div>

                                        <DialogFooter>
                                            <Button onClick={(e) => handleSave(e, incident._id)} className="w-full rounded-[5px] py-2 text-sm">
                                                Save changes
                                            </Button>
                                            <DialogClose asChild>
                                                <button id="close-dialog" className="absolute top-3 right-6 text-white text-sm hover:rounded-full">
                                                    ✕
                                                </button>
                                            </DialogClose>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </td>
                            }
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const getStatusClass = (status) => {
    switch (status) {
        case "Reported":
            return "bg-red-700 text-white";
        case "Investigating":
            return "bg-yellow-700 text-white";
        case "Identified":
            return "bg-orange-700 text-white";
        case "Monitoring":
            return "bg-blue-700 text-white";
        case "Fixed":
            return "bg-green-700 text-white";
        default:
            return "bg-gray-500 text-white";
    }
};

export default Incidents;
