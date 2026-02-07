import { Users, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200",
        isBooked ? "ring-2 ring-primary" : ""
      )}
      data-testid={`card-room-${id}`}
    >
      <CardContent className="p-6">
        {isBooked && (
          <div className="flex justify-end mb-2">
            <CheckCircle className="h-5 w-5 text-primary" />
          </div>
        )}

        <div className="mb-4">
          <h3 className="text-2xl font-bold text-foreground font-display">{name}</h3>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="font-medium">{teacher}</span>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex justify-between items-center text-sm font-semibold flex-wrap gap-1">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              Belegung
            </span>
            <span className={cn(
              "px-2 py-0.5 rounded-md text-xs",
              isFull ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
            )}>
              {occupancy} / {capacity}
            </span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        <Button
          onClick={() => onBook(id)}
          disabled={disabled || isPending || isFull}
          className="w-full"
          variant={isBooked ? "secondary" : "default"}
          data-testid={`button-book-${id}`}
        >
          {isPending ? "Moment..." : isBooked ? "Bereits gebucht" : isFull ? "Voll belegt" : "Eintragen"}
        </Button>
      </CardContent>
    </Card>
  );
}
