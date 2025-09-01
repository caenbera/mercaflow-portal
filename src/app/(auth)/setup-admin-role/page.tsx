
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions, auth } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

export default function SetupAdminRolePage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

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
      console.log('Function result:', result.data);

      toast({
        title: "Success!",
        description: "Role assigned. Please log out and log back in for the changes to take effect.",
      });
      
      // Best practice is to force a logout so that re-login reloads the claims
      await auth.signOut();
      router.push('/login');

    } catch (error: any) {
      console.error("Error calling function:", error);
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
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="font-headline">Super Admin Setup</CardTitle>
          <CardDescription>
            Click to assign the Super Admin role to your account ({user?.email}). This is a one-time action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSetup} disabled={isLoading || !user} className="w-full mt-4">
            {isLoading ? 'Processing...' : 'Become Super Admin'}
          </Button>
        </CardContent>
      </Card>
  );
}
