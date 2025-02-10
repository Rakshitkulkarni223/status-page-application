import React from 'react';

const colors = {
    'Reported': 'bg-red-700',
    'Investigating': 'bg-yellow-700',
    'Identified': 'bg-orange-700',
    'Monitoring': 'bg-blue-700',
    'Fixed': 'bg-green-700',
    'Resolved': 'bg-teal-700',
    'Scheduled': 'bg-blue-700',
    'In Progress': 'bg-yellow-700',
    'Completed': 'bg-green-700',
    'Canceled': 'bg-red-700',
    'Delayed': 'bg-amber-700',
};



const activeStatuses = [
    'Investigating',
    'Reported',
    'Monitoring',
    'Identified',
    'In Progress',
    'Scheduled',
    'Verifying'
];

const TimeLine = ({ timelines, type }) => {
    const activeTimelines = timelines.filter(activity => activeStatuses.includes(activity.status));

    return (
        <section className="incident-timeline space-y-4">
            {activeTimelines.length > 0 && activeTimelines.map((activity) => (
                <div key={activity._id} className="bg-gray-800 rounded-lg shadow-md">
                    <div className="flex justify-between items-start p-4">
                        <div className="space-y-2 flex flex-col items-start">
                            <h3 className="text-xl font-semibold">{activity.title}</h3>
                            <p className="text-sm text-gray-400">{activity.description}</p>
                            {type !== "Maintenance" ?
                                <p className="text-sm text-gray-400">{activity.created_at}</p>
                                :
                                <p className="text-sm text-gray-400">{activity.scheduled_start}</p>
                            }
                        </div>

                        <div className="flex justify-end items-center">
                            <span className={`px-2 py-1 text-white text-[12px] rounded-[5px] ${colors[activity.status]}`}>
                                {activity.status}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 rounded-[5px] px-4">
                        {[...activity.timeline].reverse().map((entry, index) => (
                            <div key={index} className={`py-4 ${index !== activity.timeline.length - 1 ? 'border-b border-gray-400' : ''}`}>
                                <div className="space-y-2 flex flex-col items-start">
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2.5 h-2.5 rounded-full ${colors[entry.status]}`} />
                                        <p className="text-gray-300 text-sm">{entry.status} -  <span className="text-gray-400 text-xs">{new Date(entry.timestamp).toLocaleString()}</span></p>
                                    </div>
                                    <p className="text-sm text-gray-300">{entry.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </section>
    );
}

export default TimeLine;
