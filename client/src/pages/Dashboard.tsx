import { useAuth } from "@/hooks/use-auth";
import { useRooms, useBookings, useCreateBooking, useDeleteBooking, useMessages } from "@/hooks/use-data";
import { Header } from "@/components/Header";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Calendar, Ticket, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: rooms, isLoading: isLoadingRooms } = useRooms();
  const { data: bookings, isLoading: isLoadingBookings } = useBookings();
  const { data: messages, isLoading: isLoadingMessages } = useMessages();
  const { mutate: bookRoom, isPending: isBooking } = useCreateBooking();
  const { mutate: cancelBooking, isPending: isCanceling } = useDeleteBooking();
  const { toast } = useToast();

  const myBooking = bookings?.find(b => b.userId === user?.id);
  const alreadyBooked = !!myBooking;

  const handleBook = (roomId: number) => {
    bookRoom(roomId, {
      onSuccess: () => {
        toast({
          title: "Erfolgreich eingetragen!",
          description: "Du bist jetzt angemeldet.",
        });
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Fehler",
          description: err.message,
        });
      }
    });
  };

  const handleCancel = () => {
    if (!myBooking) return;
    cancelBooking(myBooking.id, {
      onSuccess: () => {
        toast({
          title: "Buchung storniert",
          description: "Du wurdest erfolgreich ausgetragen.",
        });
      }
    });
  };

  if (isLoadingRooms || isLoadingBookings || isLoadingMessages) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      
      <main className="container mx-auto px-4 pt-8">
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-foreground font-display" data-testid="text-welcome">
            Hallo, {user?.username}
          </h2>
          <p className="text-muted-foreground mt-2">Willkommen bei Fit f&uuml;r den Abschluss.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                R&auml;ume verf&uuml;gbar
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rooms?.map((room) => (
                <RoomCard
                  key={room.id}
                  {...room}
                  isBooked={myBooking?.roomId === room.id}
                  onBook={handleBook}
                  isPending={isBooking}
                  disabled={alreadyBooked && myBooking?.roomId !== room.id}
                />
              ))}
            </div>
          </div>

          <div className="space-y-8">
            
            <Card className="bg-primary text-primary-foreground overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary-foreground">
                  <Ticket className="h-5 w-5" />
                  Mein Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myBooking ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-primary-foreground/70 text-sm">Eingetragen in</p>
                      <p className="text-2xl font-bold font-display" data-testid="text-my-room">{myBooking.room.name}</p>
                      <p className="text-primary-foreground/70 text-sm mt-1">
                        bei {myBooking.room.teacher}
                      </p>
                    </div>
                    <Button 
                      onClick={handleCancel}
                      disabled={isCanceling}
                      variant="secondary"
                      className="w-full"
                      data-testid="button-cancel-booking"
                    >
                      {isCanceling ? "Moment..." : "Austragen"}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="h-8 w-8 text-primary-foreground/60 mx-auto mb-3" />
                    <p className="text-primary-foreground/80">Du bist noch nirgends eingetragen.</p>
                    <p className="text-sm text-primary-foreground/60 mt-2">W&auml;hle einen Raum aus.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted border-b">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Schwarzes Brett
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {messages && messages.length > 0 ? (
                    messages.map((msg) => (
                      <div key={msg.id} className="p-4" data-testid={`text-message-${msg.id}`}>
                        <p className="text-foreground font-medium">{msg.content}</p>
                        <div className="flex justify-between items-center mt-2 flex-wrap gap-1">
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                            {msg.authorName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(msg.createdAt!).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                      Keine Nachrichten vorhanden.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="h-20 bg-card border-b mb-8" />
      <div className="container mx-auto px-4">
        <Skeleton className="h-10 w-64 mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-md" />
            ))}
          </div>
          <div className="space-y-8">
            <Skeleton className="h-48 rounded-md" />
            <Skeleton className="h-64 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
