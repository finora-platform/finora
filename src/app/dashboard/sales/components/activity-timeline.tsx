import type { Activity } from "@/types/lead"
import { CheckCircle2 } from "lucide-react"

interface ActivityTimelineProps {
  activities: Activity[]
}

/**
 * Renders a vertical timeline of sales lead activities.
 *
 * Displays each activity with a checkmark icon, title, optional subtitle, and timestamp.
 * If no activities are present, shows a placeholder message.
 *
 * @component
 * @param {ActivityTimelineProps} props - The props for the timeline.
 * @param {Activity[]} props.activities - Array of activity objects to display in the timeline.
 *
 * @example
 * <ActivityTimeline activities={[{ title: "Called client", subtitle: "Initial outreach", time: "10:00 AM" }]} />
 */
export const ActivityTimeline = ({ activities = [] }: ActivityTimelineProps) => {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-muted-foreground">No activity yet</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => (
        <div key={index} className="relative pl-6">
          <div className="absolute left-0 top-1">
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="font-medium">{activity.title}</div>
            {activity.subtitle && <div className="text-sm text-muted-foreground">{activity.subtitle}</div>}
            <div className="text-sm text-muted-foreground">{activity.time}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
