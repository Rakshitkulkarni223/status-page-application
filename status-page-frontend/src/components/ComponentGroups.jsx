import React, { useEffect, useState } from "react";
import { PencilSquareIcon } from '@heroicons/react/20/solid'; // Heroicons pencil icon
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { apiUrl } from "../config/appConfig";
import { PencilIcon } from "lucide-react";
import { useAuth } from "../contexts/authContext";
import { useSocket } from "../contexts/socketContext";
import Loader from './Loader';

const UserOwnedServices = () => {

  const [groupName, setGroupName] = useState("");
  const { user, token } = useAuth();

  const [isLoading, setIsLoading] = useState(false);

  const [loading, setLoading] = useState(false);

  const { socket } = useSocket();

  const [ownedGroupNames, setOwnedGroupNames] = useState([]);

  const handleEdit = (group) => {
    setGroupName(group.name);
  };

  useEffect(() => {
    if (!socket) return;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "GROUP_NAME_UPDATE") {
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
          });
        });
      }
    };

    return () => {
      socket.onmessage = null;
    };
  }, [socket]);

  const handleSave = async (id) => {
    setLoading(true);
    if (!groupName || groupName?.trim() === "") {
      alert("Group name cannot be empty!");
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/api/services/group/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: groupName }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Component group name has been updated successfully!');
        fetchServices();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error component group name update failed:', error);
      alert('Error component group name update failed.');
    }
    setLoading(false);

  };

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
      alert(error);
      setIsLoading(false);
      console.error('Error subscribing:', error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [])

  return (
    <div className="border-[1px]">
      <div>
        {isLoading ? <Loader loaderText='Fetching services...' /> : ownedGroupNames?.length > 0 ? ownedGroupNames.map((group) => (
          <div key={group.id}>
            <Dialog>
              <DialogTrigger asChild>
                <div
                  onClick={() => handleEdit(group)}
                  className="flex justify-between items-center p-4 border-b hover:bg-gray-800 cursor-pointer"
                >
                  <span>{group.name}</span>
                  {user?.role === "Admin" && (
                    <button className="text-blue-500 hover:text-blue-700">
                      <PencilIcon size={16} />
                    </button>
                  )}
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[450px] bg-gray-900 flex flex-col text-white max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Edit Component Group</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 items-start max-h-[60vh] overflow-y-auto py-4">
                  <div className="flex flex-col items-start gap-2">
                    <Label htmlFor="name" className="text-left">
                      Name
                    </Label>
                    <Input
                      required
                      disabled={user.role !== "Admin"}
                      id="name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="w-96 rounded-[5px]"
                    />
                  </div>
                </div>

                <DialogFooter className="flex items-end space-x-4">
                  <Button
                    disabled={user.role !== "Admin"}
                    onClick={() => handleSave(group.id)}
                    className="border-[1px] text-black bg-green-500 rounded-[5px] py-2 text-sm hover:bg-green-600"
                  >
                    {!loading ? "Update": "Updating..."}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )) : <div className='flex flex-col gap-3'>
          <p className='p-2 bg-gray-800 rounded-[5px] border-[1px] border-gray-600 text-left'>No component groups found.</p>
        </div>}
      </div>
    </div>
  );
};

export default UserOwnedServices;
