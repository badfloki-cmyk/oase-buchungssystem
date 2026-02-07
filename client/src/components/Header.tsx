import logoImg from "@assets/Design_ohne_Titel_1770456051759.png";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-white/20 shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-white shadow-inner flex items-center justify-center overflow-hidden border border-blue-100">
            <img 
              src={logoImg} 
              alt="OASE Logo" 
              className="h-full w-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-blue-900 leading-none">
              OASE
            </h1>
            <p className="text-xs md:text-sm text-blue-600 font-medium">
              Buchungssystem
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-gray-800">{user.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => logout()}
              className="rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
