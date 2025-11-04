import { CheckCircle, Clock, Truck, AlertCircle } from "lucide-react";

export interface TimelineEvent {
  timestamp: Date;
  title: string;
  description?: string;
  icon?: "check" | "clock" | "truck" | "alert";
}

interface OrderTimelineProps {
  events: TimelineEvent[];
}

export function OrderTimeline({ events }: OrderTimelineProps) {
  const getIconComponent = (
    iconType?: "check" | "clock" | "truck" | "alert"
  ) => {
    const iconClass = "h-5 w-5";
    switch (iconType) {
      case "check":
        return <CheckCircle className={`${iconClass} text-green-600`} />;
      case "truck":
        return <Truck className={`${iconClass} text-blue-600`} />;
      case "alert":
        return <AlertCircle className={`${iconClass} text-yellow-600`} />;
      case "clock":
      default:
        return <Clock className={`${iconClass} text-gray-400`} />;
    }
  };

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={index} className="flex gap-4">
          {/* Timeline icon */}
          <div className="flex flex-col items-center">
            <div className="bg-white border-2 border-gray-200 rounded-full p-2">
              {getIconComponent(event.icon)}
            </div>
            {index < events.length - 1 && (
              <div className="w-0.5 h-12 bg-gray-200 my-2" />
            )}
          </div>

          {/* Event content */}
          <div className="pb-4">
            <p className="font-semibold text-gray-900">{event.title}</p>
            <p className="text-sm text-gray-500">
              {event.timestamp.toLocaleDateString("en-AU", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {event.description && (
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
