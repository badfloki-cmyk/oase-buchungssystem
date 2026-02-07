import { useAuth } from "@/hooks/use-auth";
import { useRooms, useBookings, useCreateBooking, useDeleteBooking, useMessages } from "@/hooks/use-data";
import { Header } from "@/components/Header";
import { RoomCard } from "@/components/RoomCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Calendar, Ticket, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
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
          description: "Viel Spaß in der OASE.",
          className: "bg-green-50 border-green-200 text-green-900",
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
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Header />
      
      <main className="container mx-auto px-4 pt-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h2 className="text-3xl font-bold text-gray-900 font-display">
            Hallo, {user?.username} 👋
          </h2>
          <p className="text-gray-500 mt-2">Willkommen zurück in der OASE.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Rooms */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Räume verfügbar
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

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Current Booking Status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Ticket className="h-5 w-5" />
                    Mein Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {myBooking ? (
                    <div className="space-y-4 relative z-10">
                      <div>
                        <p className="text-blue-100 text-sm">Eingetragen in</p>
                        <p className="text-2xl font-bold font-display">{myBooking.room.name}</p>
                        <p className="text-blue-100 text-sm opacity-80 mt-1">
                          bei {myBooking.room.teacher}
                        </p>
                      </div>
                      <Button 
                        onClick={handleCancel}
                        disabled={isCanceling}
                        variant="destructive"
                        className="w-full bg-white/10 hover:bg-white/20 text-white border-0 shadow-none backdrop-blur-sm"
                      >
                        {isCanceling ? "Moment..." : "Austragen"}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6 relative z-10">
                      <div className="bg-white/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="h-6 w-6 text-blue-100" />
                      </div>
                      <p className="text-blue-100">Du bist noch nirgends eingetragen.</p>
                      <p className="text-sm text-blue-200 mt-2">Wähle einen Raum aus.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Messages / Schwarzes Brett */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="border shadow-md bg-white">
                <CardHeader className="bg-yellow-50 border-b border-yellow-100">
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    <MessageSquare className="h-5 w-5" />
                    Schwarzes Brett
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {messages && messages.length > 0 ? (
                      messages.map((msg) => (
                        <div key={msg.id} className="p-4 hover:bg-slate-50 transition-colors">
                          <p className="text-gray-800 font-medium">{msg.content}</p>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              {msg.authorName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(msg.createdAt!).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-sm">
                        Keine Nachrichten vorhanden.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

          </div>
        </div>
      </main>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="h-20 bg-white border-b mb-8" />
      <div className="container mx-auto px-4">
        <Skeleton className="h-10 w-64 mb-10" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
          <div className="space-y-8">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
