
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Help & Support</h1>
      
      <div className="mb-8">
        <Input 
          type="search"
          placeholder="Search help articles..."
          className="max-w-md"
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-3">Getting Started</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-blue-500 hover:underline">Quick Start Guide</a></li>
            <li><a href="#" className="text-blue-500 hover:underline">Account Setup</a></li>
            <li><a href="#" className="text-blue-500 hover:underline">Basic Features</a></li>
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-3">FAQs</h3>
          <ul className="space-y-2">
            <li><a href="#" className="text-blue-500 hover:underline">Billing Questions</a></li>
            <li><a href="#" className="text-blue-500 hover:underline">Technical Issues</a></li>
            <li><a href="#" className="text-blue-500 hover:underline">Feature Requests</a></li>
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-3">Contact Support</h3>
          <p className="mb-4">Need help? Our support team is available 24/7.</p>
          <Button>Contact Support</Button>
        </Card>
      </div>
    </div>
  )
}
