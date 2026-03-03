import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, UtensilsCrossed, Leaf, Drumstick } from "lucide-react";

const vegItems = [
  { name: "Rice", icon: "🍚" },
  { name: "Dal", icon: "🫘" },
  { name: "Vegetable Curry", icon: "🥘" },
  { name: "Chapati", icon: "🫓" },
  { name: "Curd", icon: "🥛" },
  { name: "Salad", icon: "🥗" },
  { name: "Paneer Curry", icon: "🧀" },
  { name: "Mixed Vegetables", icon: "🥕" },
];

const nonVegItems = [
  { name: "Chicken Curry", icon: "🍗" },
  { name: "Egg Curry", icon: "🥚" },
  { name: "Fish Fry", icon: "🐟" },
  { name: "Chicken Biryani", icon: "🍛" },
  { name: "Egg Bhurji", icon: "🍳" },
  { name: "Mutton Curry", icon: "🥩" },
];

const FoodMenu = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-2 border-border bg-card/80 backdrop-blur-sm card-hover max-w-md mx-auto">
      <CardHeader
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-warning" />
            </div>
            <CardTitle className="text-lg">Food Menu</CardTitle>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 animate-fade-in">
          {/* Veg Items */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-success font-semibold">
              <Leaf className="w-4 h-4" />
              <span>Vegetarian Items</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {vegItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 p-2 rounded-lg bg-success/10 border border-success/20"
                >
                  <span>{item.icon}</span>
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Non-Veg Items */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-destructive font-semibold">
              <Drumstick className="w-4 h-4" />
              <span>Non-Vegetarian Items</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {nonVegItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20"
                >
                  <span>{item.icon}</span>
                  <span className="text-sm">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Menu may vary based on day and availability
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default FoodMenu;
