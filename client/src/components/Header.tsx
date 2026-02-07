import logoImg from "@assets/Design_ohne_Titel_1770456051759.png";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 border-b border-border shadow-sm">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img 
            src={logoImg} 
            alt="Ernst-Reuter-Schule Logo" 
            data-testid="img-logo"
            className="h-12 object-contain"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-none font-display">
              Fit f&uuml;r den Abschluss
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">
              Raum-Buchungssystem
            </p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-foreground" data-testid="text-username">{user.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role === 'admin' ? 'Lehrer' : 'Sch\u00fcler'}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => logout()}
              data-testid="button-logout"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
