import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBookings, useDeleteBooking, useMessages, useCreateMessage, useUpdateMessage, useDeleteMessage, useResetDatabase, useSettings, useUpdateSettings, usePasswords } from "@/hooks/use-data";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Send, RefreshCw, Users, Pencil, Clock, CalendarDays, Check, KeyRound, Printer } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const { data: bookings, isLoading } = useBookings();
  const { mutate: deleteBooking } = useDeleteBooking();
  const { data: messages } = useMessages();
  const { mutate: postMessage, isPending: isPosting } = useCreateMessage();
  const { mutate: updateMessage } = useUpdateMessage();
  const { mutate: deleteMessage } = useDeleteMessage();
  const { mutate: resetDb, isPending: isResetting } = useResetDatabase();
  const { data: settings } = useSettings();
  const { mutate: updateSettings, isPending: isSavingSettings } = useUpdateSettings();
  const { data: passwords } = usePasswords();
  const [message, setMessage] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [resetDay1, setResetDay1] = useState("");
  const [resetDay2, setResetDay2] = useState("");
  const [resetTime, setResetTime] = useState("");
  const { toast } = useToast();

  const dayNames: Record<number, string> = {
    0: "Sonntag", 1: "Montag", 2: "Dienstag", 3: "Mittwoch",
    4: "Donnerstag", 5: "Freitag", 6: "Samstag"
  };

  const handlePostMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    postMessage(message, {
      onSuccess: () => {
        setMessage("");
        toast({ title: "Nachricht veroeffentlicht" });
      }
    });
  };

  const handleEditMessage = (id: number) => {
    if (!editContent.trim()) return;
    updateMessage({ id, content: editContent }, {
      onSuccess: () => {
        setEditingId(null);
        setEditContent("");
        toast({ title: "Nachricht aktualisiert" });
      }
    });
  };

  const handleDeleteMessage = (id: number) => {
    deleteMessage(id, {
      onSuccess: () => {
        toast({ title: "Nachricht geloescht" });
      }
    });
  };

  const handleReset = () => {
    resetDb(undefined, {
      onSuccess: () => {
        toast({ title: "Alle Buchungen zurueckgesetzt" });
      }
    });
  };

  const handleScheduleReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetDay1 || !resetDay2 || !resetTime) return;
    updateSettings({
      resetDay1: parseInt(resetDay1),
      resetDay2: parseInt(resetDay2),
      resetTime,
    }, {
      onSuccess: () => {
        toast({ title: "Wöchentlicher Reset geplant" });
        setResetDay1("");
        setResetDay2("");
        setResetTime("");
      }
    });
  };

  const handleClearSchedule = () => {
    updateSettings({ resetDay1: null, resetDay2: null, resetTime: null }, {
      onSuccess: () => {
        toast({ title: "Geplanter Reset entfernt" });
      }
    });
  };

  const bookingsByRoom = bookings?.reduce((acc, booking) => {
    const roomName = booking.room.name;
    if (!acc[roomName]) acc[roomName] = [];
    acc[roomName].push(booking);
    return acc;
  }, {} as Record<string, typeof bookings>);

  const hasSchedule = settings?.resetDay1 != null && settings?.resetDay2 != null && settings?.resetTime;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />

      <main className="container mx-auto px-4 pt-8 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold font-display text-foreground">Lehrer Dashboard</h2>
            <p className="text-muted-foreground">Verwaltung der Buchungen</p>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" data-testid="button-reset-db">
                <RefreshCw className="mr-2 h-4 w-4" />
                Jetzt zur&uuml;cksetzen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Alles zur&uuml;cksetzen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Dies l&ouml;scht alle Buchungen. Diese Aktion kann nicht r&uuml;ckg&auml;ngig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} data-testid="button-confirm-reset">
                  {isResetting ? "L&ouml;scht..." : "Zur&uuml;cksetzen"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted border-b">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Aktive Buchungen
                </CardTitle>
                <CardDescription>
                  Gesamt: {bookings?.length || 0} eingetragen
                </CardDescription>
              </CardHeader>
              
              <Tabs defaultValue="all" className="w-full">
                <div className="p-4 border-b">
                  <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="all" data-testid="tab-all-bookings">Alle</TabsTrigger>
                    {Object.keys(bookingsByRoom || {}).map(room => (
                      <TabsTrigger key={room} value={room} data-testid={`tab-room-${room}`}>{room}</TabsTrigger>
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

          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-muted border-b">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Automatischer Reset
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {hasSchedule && (
                  <div className="flex items-center justify-between p-3 bg-primary/10 rounded-md flex-wrap gap-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">Aktiver Zeitplan:</p>
                      <p className="text-sm text-muted-foreground">
                        <CalendarDays className="inline h-3 w-3 mr-1" />
                        {dayNames[settings!.resetDay1!]} & {dayNames[settings!.resetDay2!]} um {settings!.resetTime}
                      </p>
                      {settings?.lastResetAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Letzter Reset: {new Date(settings.lastResetAt).toLocaleDateString('de-DE')} {new Date(settings.lastResetAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClearSchedule} data-testid="button-clear-schedule">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <form onSubmit={handleScheduleReset} className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tag 1</label>
                    <Select onValueChange={setResetDay1} value={resetDay1}>
                      <SelectTrigger data-testid="select-reset-day1">
                        <SelectValue placeholder="Wochentag..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(dayNames).map(([val, name]) => (
                          <SelectItem key={val} value={val}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tag 2</label>
                    <Select onValueChange={setResetDay2} value={resetDay2}>
                      <SelectTrigger data-testid="select-reset-day2">
                        <SelectValue placeholder="Wochentag..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(dayNames).map(([val, name]) => (
                          <SelectItem key={val} value={val}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Uhrzeit</label>
                    <Input
                      type="time"
                      value={resetTime}
                      onChange={(e) => setResetTime(e.target.value)}
                      data-testid="input-reset-time"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSavingSettings || !resetDay1 || !resetDay2 || !resetTime}
                    data-testid="button-schedule-reset"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Zeitplan speichern
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted border-b">
                <CardTitle className="font-display">Nachricht posten</CardTitle>
                <CardDescription>F&uuml;r das Schwarze Brett</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handlePostMessage} className="space-y-4">
                  <Input
                    placeholder="Wichtige Info..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    data-testid="input-message"
                  />
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isPosting || !message.trim()}
                    data-testid="button-post-message"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Ver&ouml;ffentlichen
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-muted border-b">
                <CardTitle className="font-display">Nachrichten verwalten</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {messages && messages.length > 0 ? (
                    messages.map((msg) => (
                      <div key={msg.id} className="p-4" data-testid={`admin-message-${msg.id}`}>
                        {editingId === msg.id ? (
                          <div className="space-y-2">
                            <Input 
                              value={editContent} 
                              onChange={(e) => setEditContent(e.target.value)}
                              data-testid={`input-edit-message-${msg.id}`}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleEditMessage(msg.id)} data-testid={`button-save-message-${msg.id}`}>
                                Speichern
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                Abbrechen
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-foreground font-medium">{msg.content}</p>
                            <div className="flex justify-between items-center mt-2 flex-wrap gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.createdAt!).toLocaleDateString('de-DE')}
                              </span>
                              <div className="flex gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => { setEditingId(msg.id); setEditContent(msg.content); }}
                                  data-testid={`button-edit-message-${msg.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  data-testid={`button-delete-message-${msg.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
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

        <div className="mt-8">
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted border-b flex flex-row items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="h-5 w-5 text-primary" />
                  Passwortliste
                </CardTitle>
                <CardDescription>Alle Zugangsdaten</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow || !passwords) return;
                  const studentPasswords = passwords.filter(p => p.role !== 'admin');
                  const grouped: Record<string, typeof passwords> = {};
                  studentPasswords.forEach(p => {
                    const group = p.className;
                    if (!grouped[group]) grouped[group] = [];
                    grouped[group].push(p);
                  });
                  const sortedGroups = Object.keys(grouped).sort();
                  let html = `<html><head><title>Passwortliste</title><style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { font-size: 18px; margin-bottom: 20px; }
                    h2 { font-size: 14px; margin: 16px 0 8px; background: #f0f0f0; padding: 4px 8px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                    th, td { border: 1px solid #ddd; padding: 6px 10px; text-align: left; font-size: 12px; }
                    th { background: #f5f5f5; font-weight: bold; }
                    @media print { body { padding: 0; } }
                  </style></head><body>`;
                  html += '<h1>Fit f\u00fcr den Abschluss - Passwortliste</h1>';
                  sortedGroups.forEach(group => {
                    html += `<h2>${group}</h2><table><tr><th>Name</th><th>Passwort</th></tr>`;
                    grouped[group].sort((a, b) => a.username.localeCompare(b.username, 'de')).forEach(p => {
                      html += `<tr><td>${p.username}</td><td style="font-family:monospace">${p.password}</td></tr>`;
                    });
                    html += '</table>';
                  });
                  html += '</body></html>';
                  printWindow.document.write(html);
                  printWindow.document.close();
                  printWindow.print();
                }}
                data-testid="button-print-passwords"
              >
                <Printer className="mr-2 h-4 w-4" />
                Drucken
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {passwords && (() => {
                const studentPasswords = passwords.filter(p => p.role !== 'admin');
                const grouped: Record<string, typeof passwords> = {};
                studentPasswords.forEach(p => {
                  const group = p.className;
                  if (!grouped[group]) grouped[group] = [];
                  grouped[group].push(p);
                });
                const sortedGroups = Object.keys(grouped).sort();
                return sortedGroups.map(group => (
                  <div key={group}>
                    <div className="px-4 py-2 bg-muted/50 border-b font-medium text-sm text-foreground" data-testid={`text-password-group-${group}`}>
                      {group} ({grouped[group].length})
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Passwort</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grouped[group].sort((a, b) => a.username.localeCompare(b.username, 'de')).map((p) => (
                          <TableRow key={p.username} data-testid={`row-password-${p.username}`}>
                            <TableCell className="font-medium">{p.username}</TableCell>
                            <TableCell className="font-mono text-sm">{p.password}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function BookingTable({ bookings, onDelete }: { bookings: any[], onDelete: (id: number) => void }) {
  if (bookings.length === 0) {
    return <div className="p-8 text-center text-muted-foreground">Keine Buchungen vorhanden.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sch&uuml;ler</TableHead>
          <TableHead>Klasse</TableHead>
          <TableHead>Raum</TableHead>
          <TableHead className="text-right">Aktion</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((booking: any) => (
          <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
            <TableCell className="font-medium">{booking.user.username}</TableCell>
            <TableCell>
              <Badge variant="outline">
                {booking.user.className || "-"}
              </Badge>
            </TableCell>
            <TableCell>{booking.room.name}</TableCell>
            <TableCell className="text-right">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => onDelete(booking.id)}
                data-testid={`button-delete-booking-${booking.id}`}
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
