import { Progress } from "@/components/ui/progress";

interface OrderStatusProps {
  status: string;
}

export default function OrderStatus({ status }: OrderStatusProps) {
  const getProgressPercentage = (status: string) => {
    switch(status) {
      case 'received':
        return 33;
      case 'preparing':
        return 66;
      case 'ready':
        return 100;
      default:
        return 0;
    }
  };

  const getProgressColor = (status: string) => {
    switch(status) {
      case 'received':
        return 'bg-status-received';
      case 'preparing':
        return 'bg-status-preparing';
      case 'ready':
        return 'bg-status-ready';
      default:
        return 'bg-neutral-300';
    }
  };

  return (
    <div className="mt-4 mb-2">
      <Progress
        value={getProgressPercentage(status)}
        className="h-2 bg-gray-200 rounded-full"
        indicatorClassName={getProgressColor(status)}
      />
      
      <div className="flex justify-between text-xs text-neutral-400 mt-2">
        <span>Order Received</span>
        <span>Preparing</span>
        <span>Ready for Pickup</span>
      </div>
    </div>
  );
}
