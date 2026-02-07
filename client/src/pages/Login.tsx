import { useState } from "react";
import { useAuth, useUsers } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, ShieldCheck, ArrowRight } from "lucide-react";
import logoImg from "@assets/Design_ohne_Titel_1770456051759.png";

export default function Login() {
  const { login, isLoggingIn, loginError } = useAuth();
  const { data: users } = useUsers();
  
  const [studentId, setStudentId] = useState("");
  const [studentPass, setStudentPass] = useState("");
  
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) return;
    const user = users?.find(u => u.id.toString() === studentId);
    if (user) {
      login({ username: user.username, password: studentPass });
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username: adminUser, password: adminPass });
  };

  const students = (users?.filter(u => u.role === "student") || []).sort((a, b) => a.username.localeCompare(b.username, 'de'));

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img 
            src={logoImg} 
            alt="Ernst-Reuter-Schule Logo" 
            data-testid="img-login-logo"
            className="h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-foreground font-display mb-1">Fit f&uuml;r den Abschluss</h1>
          <p className="text-muted-foreground text-sm">Raum-Buchungssystem</p>
        </div>

        <Card className="border shadow-lg overflow-hidden">
          <Tabs defaultValue="student" className="w-full">
            <div className="bg-muted border-b p-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student" data-testid="tab-student">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Sch&uuml;ler
                </TabsTrigger>
                <TabsTrigger value="admin" data-testid="tab-admin">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Lehrer
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-8">
              {loginError && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-6 border border-destructive/20" data-testid="text-login-error">
                  {loginError.message}
                </div>
              )}

              <TabsContent value="student" className="mt-0">
                <form onSubmit={handleStudentLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Name ausw&auml;hlen</Label>
                    <Select onValueChange={setStudentId} value={studentId}>
                      <SelectTrigger data-testid="select-student-name">
                        <SelectValue placeholder="W&auml;hle deinen Namen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()} data-testid={`select-student-${u.id}`}>
                            {u.username} ({u.className})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Passwort</Label>
                    <Input 
                      type="password" 
                      placeholder="Passwort eingeben" 
                      value={studentPass}
                      onChange={(e) => setStudentPass(e.target.value)}
                      data-testid="input-student-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoggingIn || !studentId || !studentPass}
                    data-testid="button-student-login"
                  >
                    {isLoggingIn ? "Anmelden..." : "Los geht's"}
                    {!isLoggingIn && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="mt-0">
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Benutzername</Label>
                    <Input 
                      placeholder="Benutzername" 
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      data-testid="input-admin-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Passwort</Label>
                    <Input 
                      type="password" 
                      placeholder="Passwort eingeben" 
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      data-testid="input-admin-password"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isLoggingIn || !adminUser || !adminPass}
                    data-testid="button-admin-login"
                  >
                    {isLoggingIn ? "&Uuml;berpr&uuml;fe..." : "Dashboard &ouml;ffnen"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
        
        <p className="text-center text-muted-foreground/60 text-sm mt-8 font-medium">
          Ernst-Reuter-Schule Pattensen
        </p>
      </div>
    </div>
  );
}
