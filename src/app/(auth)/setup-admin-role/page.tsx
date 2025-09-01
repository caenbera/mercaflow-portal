
"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, Lightbulb } from 'lucide-react';

export default function SetupAdminRolePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const projectId = 'fresh-hub-portal'; // Your Firebase Project ID

  const handleSetup = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "You must be logged in to perform this action.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const setupSuperAdmin = httpsCallable(functions, 'setupSuperAdmin');
      const result = await setupSuperAdmin();
      console.log(result.data);
      toast({
        title: "Success!",
        description: "You have been granted Super Admin privileges. Please log out and log back in to see the changes.",
      });
      // Force refresh of the token to get new custom claims
      await user.getIdToken(true);
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred during setup.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-headline">Super Admin Setup</CardTitle>
          <CardDescription>
            Click the button below to assign the Super Admin role to your account. This is a one-time setup action. If you get an 'internal' error, please complete the step below first.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>Fixing the 'internal' Error</AlertTitle>
            <AlertDescription>
              The 'internal' error usually means there's a configuration issue in your Google Cloud project. The most common cause is that billing is not enabled for this specific project.
            </AlertDescription>
          </Alert>

          <Alert variant="default" className="flex items-start">
            <Lightbulb className="h-4 w-4 mr-3 mt-1" />
            <div>
                <AlertTitle>1. Enable Billing for the Project</AlertTitle>
                <AlertDescription>
                  Cloud Functions require billing to be enabled on your project. Click the button below to link your billing account to the 'fresh-hub-portal' project.
                   <Button variant="link" asChild className="p-0 h-auto ml-1">
                    <Link href={`https://console.cloud.google.com/billing/linkedaccount?project=${projectId}`} target="_blank" rel="noopener noreferrer">
                      Enable Billing Now
                    </Link>
                  </Button>
                </AlertDescription>
            </div>
          </Alert>

          <Button onClick={handleSetup} disabled={isLoading || !user} className="w-full mt-4">
            {isLoading ? 'Processing...' : 'Become Super Admin'}
          </Button>
          {!user && <p className="text-sm text-destructive mt-2 text-center">Please log in first.</p>}
        </CardContent>
        <CardFooter className="flex-col items-start text-sm">
            <p>After enabling billing, try clicking the "Become Super Admin" button again.</p>
          </CardFooter>
      </Card>
  );
}
