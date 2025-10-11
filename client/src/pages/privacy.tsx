import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <h3>Personal Information</h3>
          <p>
            We collect information that you provide directly to us, including:
          </p>
          <ul>
            <li>Name and email address</li>
            <li>Account credentials</li>
            <li>Payment information (processed securely by Stripe)</li>
            <li>Profile information and preferences</li>
            <li>Content you create, upload, or share</li>
          </ul>
          <h3>Automatically Collected Information</h3>
          <ul>
            <li>Log data (IP address, browser type, pages visited)</li>
            <li>Device information</li>
            <li>Cookies and similar tracking technologies</li>
            <li>Usage statistics and analytics</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>2. How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices, updates, and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Monitor and analyze trends, usage, and activities</li>
            <li>Detect, prevent, and address fraud and security issues</li>
            <li>Personalize and improve your experience</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>3. Information Sharing</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>We may share your information in the following situations:</p>
          <ul>
            <li><strong>With your consent:</strong> We may share your information when you give us permission</li>
            <li><strong>Service providers:</strong> Third-party vendors who perform services on our behalf</li>
            <li><strong>Legal requirements:</strong> When required by law or to protect our rights</li>
            <li><strong>Business transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>4. Data Security</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            We implement appropriate technical and organizational measures to protect your personal information,
            including:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and penetration testing</li>
            <li>Access controls and authentication requirements</li>
            <li>Secure infrastructure and hosting</li>
            <li>Employee training on data protection</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>5. Your Rights (GDPR & CCPA)</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>If you are a resident of the European Economic Area (GDPR) or California (CCPA), you have the following rights:</p>
          <ul>
            <li><strong>Access:</strong> Request a copy of your personal data</li>
            <li><strong>Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
            <li><strong>Restriction:</strong> Request limitation of processing</li>
            <li><strong>Portability:</strong> Receive your data in a portable format</li>
            <li><strong>Objection:</strong> Object to processing of your data</li>
            <li><strong>Withdraw consent:</strong> Withdraw consent at any time</li>
            <li><strong>Non-discrimination:</strong> Not be discriminated against for exercising privacy rights</li>
          </ul>
          <p>To exercise these rights, please contact us at privacy@echoverse.com or use the GDPR data export feature in your account settings.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>6. Data Retention</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            We retain your personal information for as long as necessary to provide our services and for
            legitimate business purposes. When you delete your account, we will delete or anonymize your
            personal information, except where we are required to retain it by law.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>7. Cookies</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            We use cookies and similar tracking technologies to track activity on our Service. You can
            instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However,
            if you do not accept cookies, you may not be able to use some portions of our Service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>8. Children's Privacy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            Our Service does not address anyone under the age of 13. We do not knowingly collect personally
            identifiable information from children under 13. If you are a parent or guardian and you are
            aware that your child has provided us with personal data, please contact us.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>9. Changes to This Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting
            the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>10. Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none">
          <p>
            If you have any questions about this Privacy Policy, please contact us:
            <br />
            Email: privacy@echoverse.com
            <br />
            Address: [Your Company Address]
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
