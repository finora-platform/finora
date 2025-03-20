import { CheckCircle } from "lucide-react"
import type { Activity } from "@/types/lead"

interface ActivityTabProps {
  activities: Activity[]
}

export function ActivityTab({ activities }: ActivityTabProps) {
  // If no activities provided, show sample data
  const displayActivities =
    activities.length > 0
      ? activities
      : [
          {
            id: "1",
            date: "20th Jan 2025",
            events: [
              {
                id: "e1",
                type: "client_called",
                title: "Client Called",
                time: "14:05",
                description: "",
              },
              {
                id: "e2",
                type: "lead_generated",
                title: "Lead generated",
                time: "11:45",
                description: "Website",
              },
            ],
          },
        ]

  return (
    <div className="p-4 space-y-6">
      {displayActivities.map((activityGroup) => (
        <div key={activityGroup.id} className="space-y-4">
          <h3 className="text-sm font-medium text-gray-500">{activityGroup.date}</h3>
          <div className="space-y-4">
            {activityGroup.events.map((event) => (
              <div key={event.id} className="flex items-start">
                <div className="mr-3 mt-0.5">
                  {event.type === "client_called" ? (
                    <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-purple-600" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{event.title}</h4>
                    <span className="text-sm text-gray-500">{event.time}</span>
                  </div>
                  {event.description && <p className="text-sm text-gray-500 mt-1">{event.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

