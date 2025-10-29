import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-green-50 to-red-50 flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md mx-auto px-6">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <Heart className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-medium text-gray-700">Oops...</h2>
        <p className="text-gray-600">
          Cette liste de souhaits n&apos;existe pas ou a expiré
        </p>
        <Button asChild className="bg-red-500 hover:bg-red-600 text-white">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  );
}
