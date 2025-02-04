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

const user = {
  id: localStorage.getItem("userId"),
  role: localStorage.getItem('role'),
  owned_service_groups: localStorage.getItem('owned_service_groups')?.split(',')
};


const UserOwnedServices = () => {

  const [editingGroup, setEditingGroup] = useState(null);
  const [groupName, setGroupName] = useState("");

  const [ownedGroupNames, setOwnedGroupNames] = useState([]);

  const handleEdit = (group) => {
    setEditingGroup(group);
    setGroupName(group.name);
  };

  const handleSave = () => {
    console.log("Updated group name:", groupName);
    setEditingGroup(null);
    document.getElementById("close-dialog").click();
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
      setOwnedGroupNames(user.role === "Admin" ? data: data
        .filter(group => user.owned_service_groups.includes(group.id)))
      setServices(data);
    } catch (error) {
      console.error('Error subscribing:', error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [])

  return (
    <div className="border-[1px]">
      <div>
        {ownedGroupNames.map((group) => (
          <div key={group.id}>
            <Dialog>
              <DialogTrigger asChild>
                <div onClick={() => handleEdit(group)} className="flex justify-between items-center p-4 border-b hover:bg-gray-800 cursor-pointer">
                  <span>{group.name}</span>
                  <button className="flex items-center">
                    <PencilSquareIcon className="w-5 h-5 text-blue-500" />
                    <p className="ml-2">Edit</p>
                  </button>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] bg-gray-900">
                <DialogHeader>
                  <DialogTitle>Edit Component Group</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      disabled={user.role !== "Admin"}
                      id="name"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="col-span-3 rounded-[5px]"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button  disabled={user.role !== "Admin"} onClick={handleSave} className="w-full rounded-[5px] py-2 text-sm">
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserOwnedServices;
