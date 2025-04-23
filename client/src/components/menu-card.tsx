import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MenuItem } from "@shared/schema";

interface MenuCardProps {
  item: MenuItem;
  onAddToCart: () => void;
  compact?: boolean;
}

export default function MenuCard({ item, onAddToCart, compact = false }: MenuCardProps) {
  const getCategoryBadge = (category: string) => {
    switch(category) {
      case 'veg':
        return (
          <Badge className="bg-accent text-white">
            <i className="ri-plant-line mr-1"></i> Veg
          </Badge>
        );
      case 'nonveg':
        return (
          <Badge className="bg-red-500 text-white">
            <i className="ri-restaurant-line mr-1"></i> Non-Veg
          </Badge>
        );
      case 'snacks':
        return (
          <Badge className="bg-yellow-500 text-white">
            Snacks
          </Badge>
        );
      case 'beverages':
        return (
          <Badge className="bg-blue-500 text-white">
            Beverages
          </Badge>
        );
      default:
        return null;
    }
  };

  // Fallback images based on category
  const getFallbackImage = (category: string) => {
    switch(category) {
      case 'veg':
        return "https://images.unsplash.com/photo-1623238913327-121b8a7e7b93?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
      case 'nonveg':
        return "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
      case 'snacks':
        return "https://images.unsplash.com/photo-1551024601-bec78aea704b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
      case 'beverages':
        return "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
      default:
        return "https://images.unsplash.com/photo-1613844237701-8f3664fc2eff?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60";
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full">
      <img 
        src={item.imageUrl || getFallbackImage(item.category)} 
        alt={item.name}
        className={`w-full object-cover ${compact ? 'h-40' : 'h-48'}`}
      />
      <CardContent className={`p-4 ${compact ? 'space-y-2' : 'space-y-3'}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className={`font-opensans font-semibold text-neutral-500 ${compact ? 'text-sm' : ''}`}>{item.name}</h3>
            {item.description && (
              <p className={`text-neutral-400 ${compact ? 'text-xs' : 'text-sm'}`}>{item.description}</p>
            )}
          </div>
          {getCategoryBadge(item.category)}
        </div>
        
        <div className="flex justify-between items-center mt-auto">
          <span className="font-medium text-neutral-500">₹{item.price}</span>
          <Button 
            size={compact ? "sm" : "default"}
            className="bg-primary text-white hover:bg-orange-600 rounded-full"
            onClick={onAddToCart}
            disabled={!item.isAvailable}
          >
            {item.isAvailable ? (compact ? "Add" : "Add to Cart") : "Out of Stock"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
