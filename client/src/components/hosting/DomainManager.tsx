
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

export function DomainManager() {
  return (
    <div className="container mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Domain & Hosting Management</h2>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SSL Certificate</CardTitle>
            <CardDescription>Your secure connection status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Badge variant="success">Active</Badge>
              <span>Expires in 80 days</span>
              <Button variant="outline">Renew Certificate</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Custom Domain</CardTitle>
            <CardDescription>Connect your own domain name</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <Input placeholder="Enter your domain" className="max-w-md" />
              <Button>Connect Domain</Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Current domain: echoverse-app.repl.co
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hosting Status</CardTitle>
            <CardDescription>Current deployment status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="success">Online</Badge>
                <span>Last deployed 2 hours ago</span>
              </div>
              <Button>View Deployment Logs</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
