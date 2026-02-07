import { useState } from "react";
import { useAuth, useUsers } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, ShieldCheck, ArrowRight } from "lucide-react";
import logoImg from "@assets/Design_ohne_Titel_1770456051759.png";
import { motion } from "framer-motion";

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
    
    // Find username from ID
    const user = users?.find(u => u.id.toString() === studentId);
    if (user) {
      login({ username: user.username, password: studentPass });
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ username: adminUser, password: adminPass });
  };

  const students = users?.filter(u => u.role === "student") || [];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 shadow-xl border-4 border-white flex items-center justify-center overflow-hidden">
             <img src={logoImg} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl font-bold text-blue-900 font-display mb-2">OASE</h1>
          <p className="text-blue-600/80 font-medium tracking-wide uppercase text-sm">Buchungssystem</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-lg overflow-hidden">
          <Tabs defaultValue="student" className="w-full">
            <div className="bg-slate-50 border-b p-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="student" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Schüler
                </TabsTrigger>
                <TabsTrigger value="admin" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Lehrer
                </TabsTrigger>
              </TabsList>
            </div>

            <CardContent className="p-8">
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-6 border border-red-100"
                >
                  {loginError.message}
                </motion.div>
              )}

              <TabsContent value="student" className="mt-0">
                <form onSubmit={handleStudentLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label>Name auswählen</Label>
                    <Select onValueChange={setStudentId} value={studentId}>
                      <SelectTrigger className="bg-white h-11 border-slate-200">
                        <SelectValue placeholder="Wähle deinen Namen..." />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((u) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            {u.username} <span className="text-slate-400 ml-2 text-xs">({u.className})</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Passwort</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••" 
                      value={studentPass}
                      onChange={(e) => setStudentPass(e.target.value)}
                      className="bg-white h-11 border-slate-200"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-bold bg-primary hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                    disabled={isLoggingIn || !studentId || !studentPass}
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
                      placeholder="admin" 
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      className="bg-white h-11 border-slate-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Passwort</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••" 
                      value={adminPass}
                      onChange={(e) => setAdminPass(e.target.value)}
                      className="bg-white h-11 border-slate-200"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-bold bg-slate-800 hover:bg-slate-900 shadow-lg shadow-slate-900/20"
                    disabled={isLoggingIn || !adminUser || !adminPass}
                  >
                    {isLoggingIn ? "Überprüfe..." : "Dashboard öffnen"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
        
        <p className="text-center text-blue-800/40 text-sm mt-8 font-medium">
          © 2024 Schule am OASE Park
        </p>
      </motion.div>
    </div>
  );
}
