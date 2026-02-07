import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4 shadow-xl border-none">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-20 w-20 text-red-500 opacity-80" />
          </div>
          
          <h1 className="text-3xl font-bold font-display text-gray-900">
            404 Seite nicht gefunden
          </h1>
          
          <p className="text-gray-500">
            Hoppla! Die gesuchte Seite existiert nicht oder wurde verschoben.
          </p>

          <Link href="/">
            <Button className="w-full mt-4" size="lg">
              Zurück zur Startseite
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
