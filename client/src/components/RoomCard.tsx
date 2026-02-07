import { motion } from "framer-motion";
import { Users, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface RoomCardProps {
  id: number;
  name: string;
  teacher: string;
  capacity: number;
  occupancy: number;
  isBooked: boolean;
  onBook: (id: number) => void;
  isPending: boolean;
  disabled: boolean;
}

export function RoomCard({ 
  id, 
  name, 
  teacher, 
  capacity, 
  occupancy, 
  isBooked, 
  onBook, 
  isPending,
  disabled
}: RoomCardProps) {
  const percentage = Math.min((occupancy / capacity) * 100, 100);
  const isFull = occupancy >= capacity;
  
  // Color logic based on occupancy
  let colorClass = "bg-green-500";
  let bgClass = "bg-green-50 border-green-200";
  if (percentage > 80) {
    colorClass = "bg-red-500";
    bgClass = "bg-red-50 border-red-200";
  } else if (percentage > 50) {
    colorClass = "bg-yellow-500";
    bgClass = "bg-yellow-50 border-yellow-200";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 border shadow-lg transition-all duration-300",
        "bg-white hover:shadow-xl",
        isBooked ? "ring-2 ring-primary border-primary" : "border-transparent"
      )}
    >
      {isBooked && (
        <div className="absolute top-4 right-4 text-primary animate-in zoom-in duration-300">
          <CheckCircle className="h-6 w-6" />
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-2xl font-bold text-gray-800 font-display">{name}</h3>
        <div className="flex items-center gap-2 mt-1 text-gray-500">
          <User className="h-4 w-4" />
          <span className="font-medium">{teacher}</span>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm font-semibold">
          <span className="flex items-center gap-1 text-gray-600">
            <Users className="h-4 w-4" />
            Belegung
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded-full text-xs",
            isFull ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
          )}>
            {occupancy} / {capacity}
          </span>
        </div>
        <Progress value={percentage} className="h-2" indicatorClassName={colorClass} />
      </div>

      <Button
        onClick={() => onBook(id)}
        disabled={disabled || isPending || isFull}
        className={cn(
          "w-full h-12 rounded-xl text-base font-bold shadow-md transition-all",
          isBooked 
            ? "bg-primary/10 text-primary hover:bg-primary/20 shadow-none" 
            : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white"
        )}
      >
        {isPending ? "Moment..." : isBooked ? "Bereits gebucht" : isFull ? "Voll belegt" : "Eintragen"}
      </Button>
    </motion.div>
  );
}
