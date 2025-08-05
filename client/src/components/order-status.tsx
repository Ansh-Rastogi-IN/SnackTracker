import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, XCircle, Loader2 } from "lucide-react";

interface OrderStatusProps {
  status: string;
  showIcon?: boolean;
}

export default function OrderStatus({ status, showIcon = true }: OrderStatusProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "received":
        return {
          label: "Order Received",
          color: "bg-blue-100 text-blue-800 border-blue-200",
          icon: Clock,
          description: "Your order has been received and is being processed"
        };
      case "preparing":
        return {
          label: "Preparing",
          color: "bg-yellow-100 text-yellow-800 border-yellow-200",
          icon: Loader2,
          description: "Your order is being prepared in the kitchen"
        };
      case "ready":
        return {
          label: "Ready for Pickup",
          color: "bg-green-100 text-green-800 border-green-200",
          icon: CheckCircle,
          description: "Your order is ready! Please collect it from the counter"
        };
      case "completed":
        return {
          label: "Completed",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: CheckCircle,
          description: "Order has been completed"
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "bg-red-100 text-red-800 border-red-200",
          icon: XCircle,
          description: "Order has been cancelled"
        };
      default:
        return {
          label: "Unknown",
          color: "bg-gray-100 text-gray-800 border-gray-200",
          icon: AlertCircle,
          description: "Unknown order status"
        };
    }
  };

  const config = getStatusConfig(status);
  const IconComponent = config.icon;

  return (
    <div className="flex items-center gap-2">
      {showIcon && (
        <div className={`p-1 rounded-full ${config.color.replace('bg-', 'bg-opacity-20')}`}>
          <IconComponent className={`h-4 w-4 ${status === 'preparing' ? 'animate-spin' : ''}`} />
        </div>
      )}
      <Badge 
        variant="outline" 
        className={`${config.color} border`}
      >
        {config.label}
      </Badge>
      <span className="text-sm text-muted-foreground ml-2">
        {config.description}
      </span>
    </div>
  );
}
