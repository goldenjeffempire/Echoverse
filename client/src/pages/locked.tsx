'use client';

import React from 'react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LockIcon } from 'lucide-react';

export default function Locked() {
  return (
    <>
      <Helmet>
        <title>Account Locked | Echoverse</title>
        <meta name="description" content="Your account is locked pending parental approval. Please check your email for next steps." />
      </Helmet>
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-lg border border-amber-300">
          <CardHeader className="text-center">
            <div className="mx-auto bg-amber-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <LockIcon className="h-8 w-8 text-amber-600" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-semibold">Account Requires Parental Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center mb-4 text-base leading-relaxed">
              Your account has been created but requires parental approval since you're under 18.
            </p>
            <p className="text-center text-sm text-muted-foreground">
              We've sent an email to your parent or guardian. Your account will be unlocked once they approve.
            </p>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
