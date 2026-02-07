import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBookings, useDeleteBooking, useMessages, useCreateMessage, useResetDatabase } from "@/hooks/use-data";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Send, RefreshCw, Filter, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useBookings();
  const { mutate: deleteBooking } = useDeleteBooking();
  const { mutate: postMessage, isPending: isPosting } = useCreateMessage();
  const { mutate: resetDb, isPending: isResetting } = useResetDatabase();
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    postMessage(message, {
      onSuccess: () => {
        setMessage("");
        toast({ title: "Nachricht veröffentlicht" });
      }
    });
  };

  const handleReset = () => {
    resetDb(undefined, {
      onSuccess: () => {
        toast({ title: "Datenbank zurückgesetzt", className: "bg-green-50 border-green-200" });
      }
    });
  };

  // Group bookings by room
  const bookingsByRoom = bookings?.reduce((acc, booking) => {
    const roomName = booking.room.name;
    if (!acc[roomName]) acc[roomName] = [];
    acc[roomName].push(booking);
    return acc;
  }, {} as Record<string, typeof bookings>);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Header />

      <main className="container mx-auto px-4 pt-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold font-display text-gray-900">Lehrer Dashboard</h2>
            <p className="text-gray-500">Verwaltung der OASE Buchungen</p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                <RefreshCw className="mr-2 h-4 w-4" />
                Datenbank Reset
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Alles zurücksetzen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dies löscht alle Buchungen und Nachrichten. Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
                  {isResetting ? "Löscht..." : "Zurücksetzen"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Booking Lists */}
          <div className="lg:col-span-2">
            <Card className="border shadow-md bg-white overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Aktive Buchungen
                </CardTitle>
                <CardDescription>
                  Gesamt: {bookings?.length || 0} Schüler eingetragen
                </CardDescription>
              </CardHeader>
              
              <Tabs defaultValue="all" className="w-full">
                <div className="p-4 border-b bg-white">
                  <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="all">Alle anzeigen</TabsTrigger>
                    {Object.keys(bookingsByRoom || {}).map(room => (
                      <TabsTrigger key={room} value={room}>{room}</TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                <CardContent className="p-0">
                  <TabsContent value="all" className="m-0">
                    <BookingTable 
                      bookings={bookings || []} 
                      onDelete={(id) => deleteBooking(id)} 
                    />
                  </TabsContent>
                  
                  {Object.entries(bookingsByRoom || {}).map(([room, roomBookings]) => (
                    <TabsContent key={room} value={room} className="m-0">
                      <BookingTable 
                        bookings={roomBookings} 
                        onDelete={(id) => deleteBooking(id)} 
                      />
                    </TabsContent>
                  ))}
                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* Sidebar: Messages */}
          <div className="space-y-6">
            <Card className="border shadow-md bg-white">
              <CardHeader className="bg-yellow-50 border-b border-yellow-100">
                <CardTitle className="text-yellow-800 font-display">Nachricht posten</CardTitle>
                <CardDescription>Für das "Schwarze Brett" der Schüler</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handlePostMessage} className="space-y-4">
                  <Input
                    placeholder="Wichtige Info für alle..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="bg-gray-50"
                  />
                  <Button 
                    type="submit" 
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                    disabled={isPosting || !message.trim()}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Veröffentlichen
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

        </div>
      </main>
    </div>
  );
}

function BookingTable({ bookings, onDelete }: { bookings: any[], onDelete: (id: number) => void }) {
  if (bookings.length === 0) {
    return <div className="p-8 text-center text-gray-500">Keine Buchungen vorhanden.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Schüler</TableHead>
          <TableHead>Klasse</TableHead>
          <TableHead>Raum</TableHead>
          <TableHead className="text-right">Aktion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking) => (
          <TableRow key={booking.id}>
            <TableCell className="font-medium">{booking.user.username}</TableCell>
            <TableCell>
              <Badge variant="outline" className="bg-slate-100 text-slate-700">
                {booking.user.className || "-"}
              </Badge>
            </TableCell>
            <TableCell>{booking.room.name}</TableCell>
            <TableCell className="text-right">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(booking.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
