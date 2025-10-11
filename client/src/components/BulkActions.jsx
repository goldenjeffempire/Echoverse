/**
 * LOW-029: Bulk Operations Component
 */
import { useState } from 'react';
import { Trash2, Archive, Tag, Mail, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '@/components/ui/alert-dialog';
export function BulkActions({ selectedIds, totalCount, onSelectAll, onDeselectAll, actions, isAllSelected = false }) {
    const [confirmAction, setConfirmAction] = useState(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const selectedCount = selectedIds.length;
    const hasSelection = selectedCount > 0;
    const executeAction = async (action) => {
        if (action.requiresConfirmation) {
            setConfirmAction(action);
            return;
        }
        setIsExecuting(true);
        try {
            await action.onClick(selectedIds);
            onDeselectAll();
        }
        catch (error) {
            console.error('Bulk action failed:', error);
        }
        finally {
            setIsExecuting(false);
        }
    };
    const confirmAndExecute = async () => {
        if (!confirmAction)
            return;
        setIsExecuting(true);
        try {
            await confirmAction.onClick(selectedIds);
            onDeselectAll();
        }
        catch (error) {
            console.error('Bulk action failed:', error);
        }
        finally {
            setIsExecuting(false);
            setConfirmAction(null);
        }
    };
    return (<>
      <div className="flex items-center gap-4 p-4 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <Checkbox checked={isAllSelected || (hasSelection && selectedCount === totalCount)} onCheckedChange={(checked) => {
            if (checked) {
                onSelectAll();
            }
            else {
                onDeselectAll();
            }
        }} aria-label={isAllSelected || selectedCount === totalCount ? 'Deselect all' : 'Select all'}/>
          <span className="text-sm font-medium">
            {hasSelection ? `${selectedCount} selected` : 'Select all'}
          </span>
        </div>

        {hasSelection && (<div className="flex items-center gap-2">
            {actions.slice(0, 3).map(action => (<Button key={action.id} variant={action.variant === 'destructive' ? 'destructive' : 'outline'} size="sm" onClick={() => executeAction(action)} disabled={isExecuting}>
                {action.icon && <action.icon className="h-4 w-4 mr-2"/>}
                {action.label}
              </Button>))}

            {actions.length > 3 && (<DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={isExecuting}>
                    <MoreHorizontal className="h-4 w-4"/>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.slice(3).map(action => (<DropdownMenuItem key={action.id} onClick={() => executeAction(action)} className={action.variant === 'destructive' ? 'text-destructive' : ''}>
                      {action.icon && <action.icon className="h-4 w-4 mr-2"/>}
                      {action.label}
                    </DropdownMenuItem>))}
                </DropdownMenuContent>
              </DropdownMenu>)}
          </div>)}
      </div>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.confirmationMessage ||
            `Are you sure you want to ${confirmAction?.label.toLowerCase()} ${selectedCount} item${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isExecuting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmAndExecute} disabled={isExecuting} className={confirmAction?.variant === 'destructive' ? 'bg-destructive text-destructive-foreground' : ''}>
              {isExecuting ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>);
}
// Example usage with common actions
export const commonBulkActions = [
    {
        id: 'delete',
        label: 'Delete',
        icon: Trash2,
        onClick: async (ids) => {
            // Implement delete logic
            console.log('Delete:', ids);
        },
        variant: 'destructive',
        requiresConfirmation: true,
    },
    {
        id: 'archive',
        label: 'Archive',
        icon: Archive,
        onClick: async (ids) => {
            // Implement archive logic
            console.log('Archive:', ids);
        },
    },
    {
        id: 'tag',
        label: 'Add Tag',
        icon: Tag,
        onClick: async (ids) => {
            // Implement tag logic
            console.log('Tag:', ids);
        },
    },
    {
        id: 'email',
        label: 'Send Email',
        icon: Mail,
        onClick: async (ids) => {
            // Implement email logic
            console.log('Email:', ids);
        },
    },
];
