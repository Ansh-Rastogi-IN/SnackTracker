// Food images configuration for the prototype
// Using local photos from assets/images folder
import { getLocalFoodImage } from './image-imports';

export const foodImages: Record<string, string> = {
  // Vegetarian dishes
  "Butter Chicken": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
  "Paneer Tikka": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
  "Dal Makhani": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
  "Palak Paneer": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
  "Veg Biryani": "https://images.unsplash.com/photo-1563379091339-03246963d4a9?w=400&h=300&fit=crop",
  "Aloo Gobi": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
  
  // Non-vegetarian dishes
  "Chicken Curry": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
  "Fish Curry": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
  "Mutton Biryani": "https://images.unsplash.com/photo-1563379091339-03246963d4a9?w=400&h=300&fit=crop",
  "Chicken Tikka": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
  "Egg Curry": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
  
  // Snacks
  "Samosa": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
  "Pakora": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
  "Vada Pav": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
  "Poha": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
  "Upma": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
  "Idli": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
  "Dosa": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
  "Chutney": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
  
  // Local photos - Food Court items (these will be handled by getLocalFoodImage function)
  
  // Beverages
  "Masala Chai": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
  "Coffee": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop",
  "Lassi": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
  "Juice": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
  "Soda": "https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=400&h=300&fit=crop",
  "Water": "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=300&fit=crop",
  
  // Default fallback images by category
  "veg": "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop",
  "nonveg": "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
  "snacks": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop",
  "beverages": "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=300&fit=crop",
  "default": "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop"
};

// Function to get image URL for a menu item
export function getFoodImage(itemName: string, category?: string): string {
  // First try to get local image
  const localImage = getLocalFoodImage(itemName);
  if (localImage) {
    return localImage;
  }
  
  // Then try to find exact match in foodImages
  if (foodImages[itemName]) {
    return foodImages[itemName];
  }
  
  // Then try category fallback
  if (category && foodImages[category]) {
    return foodImages[category];
  }
  
  // Finally return default
  return foodImages.default;
}

// Function to get category-specific image
export function getCategoryImage(category: string): string {
  return foodImages[category] || foodImages.default;
} 