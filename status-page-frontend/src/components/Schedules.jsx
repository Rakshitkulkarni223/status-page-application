import React, { useEffect, useState } from "react";
import { Pencil, PencilOff } from "lucide-react";
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
import { apiUrl } from "../config/appConfig";
import { useAuth } from "../contexts/authContext";
import { useSocket } from "../contexts/socketContext";

const Schedules = () => {

    const { user, token } = useAuth();
    const { socket } = useSocket();

    const [maintenanceTitle, setMaintenanceTitle] = useState("");
    const [maintenanceStatus, setMaintenanceStatus] = useState("");
    const [maintenanceDescription, setMaintenanceDescription] = useState("");
    const [maintenanceScheduledStart, setMaintenanceScheduledStart] = useState("");
    const [maintenanceScheduledEnd, setMaintenanceScheduledEnd] = useState("");
    const [maintenanceStatusContent, setMaintenanceStatusContent] = useState("");

    const [maintenanceDelayedStart, setMaintenanceDelayedStart] = useState("");
    const [maintenanceDelayedEnd, setMaintenanceDelayedEnd] = useState("");

    const handleEditClick = (maintenanceItem) => {
        setMaintenanceTitle(maintenanceItem.title);
        setMaintenanceStatus(maintenanceItem.status);
        setMaintenanceDescription(maintenanceItem.description);
        setMaintenanceScheduledStart(maintenanceItem.scheduled_start.replace('Z', '').slice(0, 16));
        setMaintenanceScheduledEnd(maintenanceItem.scheduled_end.replace('Z', '').slice(0, 16));
    };

    const [maintenance, setMaintenance] = useState([]);

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

    useEffect(() => {
        fetchMaintence();
    }, [])

    useEffect(() => {
        if (!socket) return;

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "SCHEDULE_NEW_MAINTENANCE") {
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


    const handleSave = async (id) => {

        if (!maintenanceStatusContent) {
            alert("Status description cannot be empty. Please fill all the required fields.");
            return;
        }

        if (maintenanceStatus === "Delayed") {
            if (!maintenanceStatusContent || !maintenanceDelayedStart || !maintenanceDelayedEnd) {
                alert("Status description, Delayed start date and end date cannot be empty. Please fill all the required fields.");
                return;
            }
        }

        const maintenanceData = {
            status: maintenanceStatus,
            delayed_start: maintenanceDelayedStart,
            delayed_end: maintenanceDelayedEnd,
            timeline: maintenanceStatus !== 'Scheduled' ? [{ status: maintenanceStatus, content: maintenanceStatusContent }] : [],
        }

        try {
            const response = await fetch(`${apiUrl}/api/maintenance/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(maintenanceData),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Service maintenance updated successfully!');
                document.getElementById("close-dialog").click();
                fetchMaintence();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error updating service maintenance schedule:', error);
            alert('Error updating service maintenance scheduled.');
        }
    };

    const statusOptions = ["Scheduled", "In Progress", "Completed", "Canceled", "Delayed"];

    return (
        <div className="rounded-b-[10px]">
            <table className="border-[1px] min-w-full table-auto">
                <thead>
                    <tr className="bg-gray-700 text-white">
                        <th className="px-6 py-3 text-left text-sm font-semibold">Maintenance Title</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Scheduled Start</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Scheduled End</th>
                        {user.role === "Admin" && <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {maintenance.map((maintenanceItem) => (
                        <tr key={maintenanceItem._id} className="border-t hover:bg-gray-800">
                            <td className="px-6 py-3 text-sm">{maintenanceItem.title}</td>
                            <td className="px-6 py-3 text-sm">
                                <span className={`px-2 py-1 text-[12px] rounded-[5px] ${getStatusClass(maintenanceItem.status)}`}>
                                    {maintenanceItem.status}
                                </span>
                            </td>
                            <td className="px-6 py-3 text-sm">{maintenanceItem.scheduled_start.replace('Z', '').slice(0, 16)}</td>
                            <td className="px-6 py-3 text-sm">{maintenanceItem.scheduled_end.replace('Z', '').slice(0, 16)}</td>
                            {user.role === "Admin" && <td className="px-6 py-3 flex space-x-3">
                                <Dialog onOpenChange={(isOpen) => {
                                    if (!isOpen) {
                                        setMaintenanceDelayedEnd('');
                                        setMaintenanceDelayedStart('');
                                        setMaintenanceDescription('');
                                        setMaintenanceScheduledEnd('');
                                        setMaintenanceScheduledStart('');
                                        setMaintenanceStatus('');
                                        setMaintenanceStatusContent('');
                                        setMaintenanceTitle('');
                                    }
                                }}>
                                    <DialogTrigger asChild>
                                        {maintenanceItem.status !== "Canceled" ? <button onClick={() => handleEditClick(maintenanceItem)} className="text-blue-500 hover:text-blue-700">
                                            <Pencil size={16} />
                                        </button> : <button disabled className="text-red-500 hover:text-red-700">
                                            <PencilOff size={16} />
                                        </button>}
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[720px] bg-gray-900 text-white max-h-[80vh] overflow-auto">
                                        <DialogHeader>
                                            <DialogTitle>Edit Maintenance</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 max-h-[60vh] overflow-y-auto py-4 px-3">
                                            <div className="grid grid-cols-4 items-center gap-2">
                                                <Label htmlFor="maintenance-title" className="text-right">
                                                    Title
                                                </Label>
                                                <Input
                                                    disabled
                                                    id="maintenance-title"
                                                    value={maintenanceTitle}
                                                    onChange={(e) => setMaintenanceTitle(e.target.value)}
                                                    className="col-span-3 rounded-[5px]"
                                                />
                                            </div>

                                            <div className="grid grid-cols-4 items-center gap-2">
                                                <Label className="text-right">Status</Label>
                                                <div className="col-span-3 flex flex-wrap gap-2">
                                                    {statusOptions.map((status, index) => (
                                                        <Button
                                                            disabled={index < 3}
                                                            key={status}
                                                            onClick={() => setMaintenanceStatus(status)}
                                                            className={maintenanceStatus === status ? "bg-blue-500" : "bg-gray-500"}
                                                        >
                                                            {status}
                                                        </Button>
                                                    ))}
                                                </div>
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

                                            <div className="grid grid-cols-4 items-center gap-2">
                                                <Label htmlFor="maintenance-description" className="text-right">
                                                    Description
                                                </Label>
                                                <Textarea
                                                    disabled
                                                    id="maintenance-description"
                                                    value={maintenanceDescription}
                                                    onChange={(e) => setMaintenanceDescription(e.target.value)}
                                                    className="col-span-3 rounded-[5px]"
                                                />
                                            </div>

                                            <div className="grid grid-cols-4 items-center gap-3">
                                                <div>
                                                    <Label htmlFor="maintenance-scheduled-start" className="text-right">
                                                        Scheduled Start
                                                    </Label>
                                                    <Input
                                                        disabled
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
                                                        disabled
                                                        id="maintenance-scheduled-end"
                                                        value={maintenanceScheduledEnd}
                                                        onChange={(e) => setMaintenanceScheduledEnd(e.target.value)}
                                                        className="col-span-3 rounded-[5px]"
                                                        type="datetime-local"
                                                    />
                                                </div>
                                            </div>


                                            {(maintenanceStatus === "Delayed" || maintenanceItem.status === "Delayed") &&
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <div>
                                                        <Label htmlFor="maintenance-delayed-start" className="text-right">
                                                            Delayed Start
                                                        </Label>
                                                        <Input
                                                            id="maintenance-delayed-start"
                                                            value={maintenanceDelayedStart}
                                                            onChange={(e) => setMaintenanceDelayedStart(e.target.value)}
                                                            className="col-span-3 rounded-[5px]"
                                                            type="datetime-local"
                                                        />
                                                    </div>

                                                    <div>
                                                        <Label htmlFor="maintenance-delayed-end" className="text-right">
                                                            Delayed End
                                                        </Label>
                                                        <Input
                                                            id="maintenance-delayed-end"
                                                            value={maintenanceDelayedEnd}
                                                            onChange={(e) => setMaintenanceDelayedEnd(e.target.value)}
                                                            className="col-span-3 rounded-[5px]"
                                                            type="datetime-local"
                                                        />
                                                    </div>
                                                </div>
                                            }

                                        </div>

                                        <DialogFooter>
                                            <Button onClick={() => handleSave(maintenanceItem._id)} className="w-full rounded-[5px] py-2 text-sm">
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
        </div >
    );
};

const getStatusClass = (status) => {
    switch (status) {
        case "Scheduled":
            return "bg-blue-700 text-white";
        case "In Progress":
            return "bg-yellow-700 text-white";
        case "Verifying":
            return "bg-orange-700 text-white";
        case "Completed":
            return "bg-green-700 text-white";
        case "Canceled":
            return "bg-red-700 text-white";
        default:
            return "bg-gray-500 text-white";
    }
};

export default Schedules;
