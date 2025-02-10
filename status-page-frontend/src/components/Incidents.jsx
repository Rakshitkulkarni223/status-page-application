import React, { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiUrl } from "../config/appConfig";
import { useAuth } from "../contexts/authContext";
import { useSocket } from "../contexts/socketContext";
import Loader from "./Loader";
import { formatDate, parseFormattedDate } from "../utils/formatDate";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";


const Incidents = () => {
    const { user, token } = useAuth();

    const { socket } = useSocket();

    const [loading, setLoading] = useState(false);

    const [incidentTitle, setIncidentTitle] = useState("");
    const [incidentStatus, setIncidentStatus] = useState("");
    const [incidentDescription, setIncidentDescription] = useState("");
    const [incidentContent, setIncidentContent] = useState("");

    const [isLoading, setIsLoading] = useState(false);

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

        setLoading(true);

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
                // fetchIncidents();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error updating incident:', error);
            alert('Error updating incident.');
        }
        setLoading(false);
    };

    const statusOptions = ["Reported", "Investigating", "Identified", "Monitoring", "Fixed"];

    const [filteredIncidents, setFilteredIncidents] = useState([]);

    const [incidents, setIncidents] = useState([]);

    const fetchIncidents = async () => {
        setIsLoading(true);
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
            setIsLoading(false);
        } catch (error) {
            setIsLoading(false);
            alert(error);
            console.error('Error while fetching incidents:', error);
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
                            ? [{
                                ...data.incident, occurred_at: formatDate(data.incident.occurred_at),
                                updated_at: formatDate(data.incident.updated_at)
                            }, ...prev]
                            : [{
                                ...data.incident, occurred_at: formatDate(data.incident.occurred_at),
                                updated_at: formatDate(data.incident.updated_at)
                            }, ...prev.filter(incident => incident.reported_by === user.id)]
                    )
                }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            } else if (data.type === "UPDATE_INCIDENT") {
                setFilteredIncidents((prev) => {
                    return (
                        user.role === "Admin"
                            ? prev
                            : prev.filter(incident => incident.reported_by === user.id)
                    ).map((incidentItem) => {
                        if (incidentItem._id === data.incident._id) {
                            return {
                                ...data.incident,
                                occurred_at: formatDate(data.incident.occurred_at),
                                updated_at: formatDate(data.incident.updated_at)
                            }
                        }
                        return {
                            ...incidentItem
                        };
                    }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
                })
            }
        };

        return () => {
            socket.onmessage = null;
        };
    }, [socket]);


    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    const sortedIncidents = [...filteredIncidents].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const valueA = a[sortConfig.key];
        const valueB = b[sortConfig.key];

        if (!valueA || !valueB) return 0;

        if (sortConfig.key === "status") {
            const indexA = statusOptions.indexOf(valueA);
            const indexB = statusOptions.indexOf(valueB);

            return sortConfig.direction === "asc" ? indexA - indexB : indexB - indexA;
        }

        if (sortConfig.key === "occurred_at") {
            const dateA = parseFormattedDate(valueA);
            const dateB = parseFormattedDate(valueB);
            return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        }

        if (sortConfig.key === "updatedAt") {
            return sortConfig.direction === "asc"
                ? new Date(valueA) - new Date(valueB)
                : new Date(valueB) - new Date(valueA);
        }

        return sortConfig.direction === "asc"
            ? valueA.toString().localeCompare(valueB.toString())
            : valueB.toString().localeCompare(valueA.toString());
    });

    const requestSort = (key) => {
        setSortConfig((prev) => ({
            key,
            direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
        }));
    };

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
            {isLoading ? <Loader loaderText="Fetching incidents..." /> : filteredIncidents?.length > 0 ? <table className="border-[1px] min-w-full table-auto">
                <thead>
                    <tr className="bg-gray-700">
                        <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort("title")}>
                            Incident Title {renderSortIcon("title")}
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort("status")}>
                            Status {renderSortIcon("status")}
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort("occurred_at")}>
                            Occurred On {renderSortIcon("occurred_at")}
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold cursor-pointer" onClick={() => requestSort("updatedAt")}>
                            Updated On {renderSortIcon("updatedAt")}
                        </th>
                        {user.role === "Admin" && <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {sortedIncidents.map((incident) => (
                        <tr key={incident._id} className="border-t hover:bg-gray-800">
                            <td className="px-6 py-3 text-sm">{incident.title}</td>
                            <td className="px-6 py-3 text-sm">
                                <span className={`px-2 py-1 text-[12px] rounded-[5px] ${getStatusClass(incident.status)}`}>
                                    {incident.status}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-sm">{incident.occurred_at}</td>
                            <td className="px-6 py-3 text-sm">{incident.updated_at}</td>
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
                                    <DialogContent className="sm:max-w-[720px] bg-gray-900 flex flex-col text-white max-h-[80vh] overflow-auto">
                                        <DialogHeader>
                                            <DialogTitle>Edit Incident</DialogTitle>
                                        </DialogHeader>
                                        <div className="flex flex-col gap-4 items-start max-h-[60vh] overflow-y-auto py-4">
                                            <div className="flex flex-col items-start gap-2">
                                                <Label htmlFor="incident-title" className="w-32 text-left">
                                                    Title
                                                </Label>
                                                <Input
                                                    disabled
                                                    id="incident-title"
                                                    value={incidentTitle}
                                                    onChange={(e) => setIncidentTitle(e.target.value)}
                                                    className="flex-1 rounded-[5px]"
                                                />
                                            </div>

                                            <div className="flex flex-col items-start gap-2">
                                                <Label className="w-32 text-left">Status</Label>
                                                <div className="flex flex-wrap gap-2">
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
                                                            className={incidentStatus === status ? "rounded-[10px] text-[12px] bg-blue-600 hover:bg-blue-500"
                                                                : "rounded-[10px] text-[12px] bg-gray-500 hover:bg-gray-600"}
                                                        >
                                                            {status}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-start gap-2">
                                                <Label htmlFor="incident-status-description" className="text-right">
                                                    Status description
                                                </Label>
                                                <Textarea
                                                    id="incident-status-description"
                                                    value={incidentContent}
                                                    onChange={(e) => setIncidentContent(e.target.value)}
                                                    className="w-96 flex-1 rounded-[5px]"
                                                />
                                            </div>

                                            <div className="flex flex-col items-start gap-2">
                                                <Label htmlFor="incident-description" className="text-right">
                                                    Description
                                                </Label>
                                                <Textarea
                                                    disabled
                                                    id="incident-description"
                                                    value={incidentDescription}
                                                    onChange={(e) => setIncidentDescription(e.target.value)}
                                                    className="w-96 flex-1 rounded-[5px]"
                                                />
                                            </div>

                                            <div className="flex flex-col items-start gap-2">
                                                <Label htmlFor="incident-occured-at" className="text-right">
                                                    Occurred On
                                                </Label>
                                                <Input
                                                    disabled
                                                    id="incident-occured-at"
                                                    value={incident.occurred_at}
                                                    className="w-60 rounded-[5px]"
                                                    type="text"
                                                />
                                            </div>

                                            {incidentStatus && <div className="flex flex-col items-start gap-2">
                                                <p className="text-[15px]">Change service status</p>
                                                <div className="flex flex-row gap-2">
                                                    <Button
                                                        disabled={["Identified", "Monitoring"].includes(incidentStatus)}
                                                        onClick={() => handleStatusChange(incident._id, "Operational")}
                                                        className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[incident._id] === "Operational" ? "bg-green-700 text-white hover:bg-green-800" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                    >
                                                        Operational
                                                    </Button>
                                                    <Button
                                                        disabled={incidentStatus === "Fixed"}
                                                        onClick={() => handleStatusChange(incident._id, "Degraded Performance")}
                                                        className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[incident._id] === "Degraded Performance" ? "bg-purple-700 text-white hover:bg-purple-800" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                    >
                                                        Degraded Performance
                                                    </Button>
                                                    <Button
                                                        disabled={incidentStatus === "Fixed"}
                                                        onClick={() => handleStatusChange(incident._id, "Partial Outage")}
                                                        className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[incident._id] === "Partial Outage" ? "bg-red-600 text-white hover:bg-red-700" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                    >
                                                        Partial Outage
                                                    </Button>
                                                    <Button
                                                        disabled={incidentStatus === "Fixed"}
                                                        onClick={() => handleStatusChange(incident._id, "Major Outage")}
                                                        className={`px-2 py-1 rounded-[10px] text-[12px] ${serviceStatuses[incident._id] === "Major Outage" ? "bg-red-800 text-white  hover:bg-red-900" : "bg-gray-600 text-gray-200 hover:bg-gray-700"}`}
                                                    >
                                                        Major Outage
                                                    </Button>
                                                </div>
                                            </div>}

                                        </div>

                                        <DialogFooter className="flex items-end space-x-4">
                                            <Button disabled={loading} onClick={(e) => handleSave(e, incident._id)} className="border-[1px] text-black bg-green-500 rounded-[5px] py-2 text-sm hover:bg-green-600">
                                                {!loading ? "Update" : "Updating..."}
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                            </td>
                            }
                        </tr>
                    ))}
                </tbody>
            </table> : <div className='flex flex-col gap-3'>
                <p className='p-2 bg-gray-800 rounded-[5px] border-[1px] border-gray-600 text-left'>{user.role === "Admin" ? "No incident has been reported yet." : "No incident has been reported yet by you."}</p>
            </div>}
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
