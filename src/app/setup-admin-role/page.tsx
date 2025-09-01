"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
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
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-headline">Super Admin Setup</CardTitle>
          <CardDescription>
            Click the button below to assign the Super Admin role to your account. This is a one-time setup action. After clicking, you may need to log out and log back in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleSetup} disabled={isLoading || !user} className="w-full">
            {isLoading ? 'Processing...' : 'Become Super Admin'}
          </Button>
          {!user && <p className="text-sm text-destructive mt-2 text-center">Please log in first.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
