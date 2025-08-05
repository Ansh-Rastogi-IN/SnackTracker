import { useState } from "react";
import { Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface OrderRatingProps {
  orderId: number;
  currentRating?: number;
  currentComment?: string;
  onRatingSubmit?: () => void;
}

export default function OrderRating({ 
  orderId, 
  currentRating, 
  currentComment, 
  onRatingSubmit 
}: OrderRatingProps) {
  const [rating, setRating] = useState(currentRating || 0);
  const [comment, setComment] = useState(currentComment || "");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const ratingMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/rate`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/history"] });
      toast({
        title: "Rating submitted",
        description: "Thank you for your feedback!",
      });
      setIsOpen(false);
      onRatingSubmit?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    ratingMutation.mutate({ rating, comment });
  };

  const handleStarClick = (starRating: number) => {
    setRating(starRating);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-sm border border-primary text-primary hover:bg-primary hover:bg-opacity-10"
        >
          {currentRating ? "Update Rating" : "Rate Order"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate Your Order</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Star Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  {star <= rating ? (
                    <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                  ) : (
                    <Star className="h-6 w-6 text-gray-300 hover:text-yellow-400" />
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {rating === 0 && "Click to rate"}
              {rating === 1 && "Poor"}
              {rating === 2 && "Fair"}
              {rating === 3 && "Good"}
              {rating === 4 && "Very Good"}
              {rating === 5 && "Excellent"}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-2 block">Comment (Optional)</label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this order..."
              className="min-h-[80px]"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={ratingMutation.isPending || rating === 0}
            >
              {ratingMutation.isPending ? "Submitting..." : "Submit Rating"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 