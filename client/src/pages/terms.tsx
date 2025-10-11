import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Acceptance of Terms</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            By accessing and using EchoVerse ("the Service"), you accept and agree to be bound by the terms
            and provision of this agreement. If you do not agree to these terms, you should not use this service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. Use License</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Permission is granted to temporarily access the Service for personal, non-commercial transitory viewing only.
            This is the grant of a license, not a transfer of title, and under this license you may not:
          </p>
          <ul>
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose or public display</li>
            <li>Attempt to decompile or reverse engineer any software contained on the Service</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. User Accounts</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            When you create an account with us, you must provide accurate, complete, and current information.
            Failure to do so constitutes a breach of the Terms. You are responsible for safeguarding the
            password and for all activities that occur under your account.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Content</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Our Service allows you to create, post, store and share content. You retain ownership of any
            intellectual property rights that you hold in that content. When you upload or share content,
            you grant us a worldwide license to use, host, store, reproduce, modify, and distribute that content.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Payment Terms</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Certain aspects of the Service are provided for a fee. You agree to pay all fees or charges to
            your account based on the fees, charges, and billing terms in effect at the time.
          </p>
          <h3>Refund Policy</h3>
          <p>
            All fees are non-refundable except where required by law or as specified in your subscription terms.
            If you cancel your subscription, you will retain access until the end of your billing period.
          </p>
          <h3>Subscription Auto-Renewal</h3>
          <p>
            Subscriptions automatically renew unless cancelled before the renewal date. You can manage your
            subscription and turn off auto-renewal in your account settings.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Termination</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any
            reason whatsoever, including without limitation if you breach the Terms. Upon termination, your
            right to use the Service will immediately cease.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Limitation of Liability</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            In no event shall EchoVerse, nor its directors, employees, partners, agents, suppliers, or
            affiliates, be liable for any indirect, incidental, special, consequential or punitive damages,
            including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            If a revision is material, we will try to provide at least 30 days' notice prior to any new
            terms taking effect.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            If you have any questions about these Terms, please contact us at:
            <br />
            Email: legal@echoverse.com
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
