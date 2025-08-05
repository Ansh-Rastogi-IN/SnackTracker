import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrderTrackingProps {
  status: string;
  createdAt: string;
}

export default function OrderTracking({ status, createdAt }: OrderTrackingProps) {
  const steps = [
    { key: "received", label: "Order Received", description: "Your order has been received" },
    { key: "preparing", label: "Preparing", description: "Your order is being prepared" },
    { key: "ready", label: "Ready for Pickup", description: "Your order is ready!" },
    { key: "completed", label: "Completed", description: "Order completed" }
  ];

  const getCurrentStepIndex = (status: string) => {
    switch (status) {
      case "received": return 0;
      case "preparing": return 1;
      case "ready": return 2;
      case "completed": return 3;
      case "cancelled": return -1;
      default: return 0;
    }
  };

  const currentStepIndex = getCurrentStepIndex(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-red-700 font-medium">Order Cancelled</span>
        </div>
        <p className="text-sm text-red-600 mt-1">This order has been cancelled</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        
        {steps.map((step, index) => {
          const isCompleted = index <= currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <div key={step.key} className="relative flex items-start gap-4 mb-6">
              {/* Step indicator */}
              <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                isCompleted 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : isCurrent 
                    ? 'bg-blue-500 border-blue-500 text-white' 
                    : 'bg-gray-100 border-gray-300 text-gray-400'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className={`font-medium ${
                    isCompleted ? 'text-green-700' : 
                    isCurrent ? 'text-blue-700' : 
                    'text-gray-500'
                  }`}>
                    {step.label}
                  </h4>
                  {isCurrent && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Current
                    </Badge>
                  )}
                </div>
                <p className={`text-sm ${
                  isCompleted ? 'text-green-600' : 
                  isCurrent ? 'text-blue-600' : 
                  'text-gray-400'
                }`}>
                  {step.description}
                </p>
                {isCurrent && (
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated time: {index === 0 ? '2-3 minutes' : index === 1 ? '5-10 minutes' : 'Ready now'}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Order time info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Order placed at {new Date(createdAt).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
} 