import React, { useEffect, useState } from "react";
import { Pencil, Calendar } from "lucide-react";
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

const user = {
    id: localStorage.getItem("userId"),
    role: localStorage.getItem('role'),
    owned_service_groups: localStorage.getItem('owned_service_groups')?.split(',')
};


const Schedules = () => {
    const [maintenanceTitle, setMaintenanceTitle] = useState("");
    const [maintenanceStatus, setMaintenanceStatus] = useState("");
    const [maintenanceDescription, setMaintenanceDescription] = useState("");
    const [maintenanceScheduledStart, setMaintenanceScheduledStart] = useState("");
    const [maintenanceScheduledEnd, setMaintenanceScheduledEnd] = useState("");
    const [maintenanceTimeline, setMaintenanceTimeline] = useState([]);

    const handleEditClick = (maintenanceItem) => {
        setMaintenanceTitle(maintenanceItem.title);
        setMaintenanceStatus(maintenanceItem.status);
        setMaintenanceDescription(maintenanceItem.description);
        setMaintenanceScheduledStart(maintenanceItem.scheduled_start.replace('Z', '').slice(0, 16));
        setMaintenanceScheduledEnd(maintenanceItem.scheduled_end.replace('Z', '').slice(0, 16));
        setMaintenanceTimeline(maintenanceItem.timeline);
    };

    const [maintenance, setMaintenance] = useState([]);

    const fetchMaintence = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/maintenance', {
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

    const handleSave = async (id) => {
        const maintenanceData = {
            title: maintenanceTitle,
            description: maintenanceDescription,
            status: maintenanceStatus,
            scheduled_start: maintenanceScheduledStart,
            scheduled_end: maintenanceScheduledEnd
        }
        try {
            const response = await fetch('http://localhost:5000/api/maintenance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({id, maintenanceData}),
            });

            const data = await response.json();

            if (response.ok) {
                alert('Service maintenance scheduled successfully!');
                document.getElementById("close-dialog").click();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error creating Service maintenance scheduled:', error);
            alert('Error creating Service maintenance scheduled.');
        }
        document.getElementById("close-dialog").click();
    };

    const statusOptions = ["Scheduled", "In Progress", "Verifying", "Completed", "Canceled"];

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
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button onClick={() => handleEditClick(maintenanceItem)} className="text-blue-500 hover:text-blue-700">
                                            <Pencil size={16} />
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[700px] bg-gray-900 text-white">
                                        <DialogHeader>
                                            <DialogTitle>Edit Maintenance</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
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

                                            <div className="grid grid-cols-4 items-center gap-2 mt-2">
                                                <Label className="text-right">Status</Label>
                                                <div className="col-span-3 flex flex-wrap gap-2">
                                                    {statusOptions.map((status) => (
                                                        <Button
                                                            key={status}
                                                            onClick={() => setMaintenanceStatus(status)}
                                                            className={maintenanceStatus === status ? "bg-blue-500" : "bg-gray-500"}
                                                        >
                                                            {status}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-4 items-center gap-2 mt-2">
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

                                            <div className="grid grid-cols-4 items-center gap-2 mt-2">
                                                <Label htmlFor="maintenance-scheduled-start" className="text-right">
                                                    Scheduled Start
                                                </Label>
                                                <Input
                                                    disabled={maintenanceStatus !== "Scheduled"}
                                                    id="maintenance-scheduled-start"
                                                    value={maintenanceScheduledStart}
                                                    onChange={(e) => setMaintenanceScheduledStart(e.target.value)}
                                                    className="col-span-3 rounded-[5px]"
                                                    type="datetime-local"
                                                />
                                            </div>

                                            <div className="grid grid-cols-4 items-center gap-2 mt-2">
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

                                        <DialogFooter>
                                            <Button onClick={()=>handleSave(maintenanceItem._id)} className="w-full rounded-[5px] py-2 text-sm">
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
