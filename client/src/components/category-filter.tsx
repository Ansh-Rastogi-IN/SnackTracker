import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="mb-6 overflow-x-auto whitespace-nowrap py-2 -mx-4 px-4 scrollbar-hide">
      <div className="inline-flex space-x-2">
        <Button 
          variant={activeCategory === "all" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            activeCategory === "all" ? "bg-primary text-white" : "bg-white text-neutral-500 hover:bg-neutral-200"
          }`}
          onClick={() => onCategoryChange("all")}
        >
          All Items
        </Button>
        
        <Button 
          variant={activeCategory === "veg" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            activeCategory === "veg" ? "bg-accent text-white" : "bg-white text-neutral-500 hover:bg-neutral-200"
          }`}
          onClick={() => onCategoryChange("veg")}
        >
          <i className="ri-plant-line mr-1"></i> Veg
        </Button>
        
        <Button 
          variant={activeCategory === "nonveg" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            activeCategory === "nonveg" ? "bg-red-500 text-white" : "bg-white text-neutral-500 hover:bg-neutral-200"
          }`}
          onClick={() => onCategoryChange("nonveg")}
        >
          <i className="ri-restaurant-line mr-1"></i> Non-Veg
        </Button>
        
        <Button 
          variant={activeCategory === "snacks" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            activeCategory === "snacks" ? "bg-yellow-500 text-white" : "bg-white text-neutral-500 hover:bg-neutral-200"
          }`}
          onClick={() => onCategoryChange("snacks")}
        >
          Snacks
        </Button>
        
        <Button 
          variant={activeCategory === "beverages" ? "default" : "outline"}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200 ${
            activeCategory === "beverages" ? "bg-blue-500 text-white" : "bg-white text-neutral-500 hover:bg-neutral-200"
          }`}
          onClick={() => onCategoryChange("beverages")}
        >
          Beverages
        </Button>
      </div>
    </div>
  );
}
