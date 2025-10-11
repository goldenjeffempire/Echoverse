/**
 * LOW-025, LOW-030: Export to PDF and Multiple Formats
 */
import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

export type ExportFormat = 'pdf' | 'csv' | 'excel' | 'json';

interface ExportMenuProps {
  data: any[];
  filename?: string;
  onExport?: (format: ExportFormat, data: any[]) => Promise<Blob | void>;
  formats?: ExportFormat[];
}

export function ExportMenu({
  data,
  filename = 'export',
  onExport,
  formats = ['pdf', 'csv', 'excel', 'json']
}: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToPDF = async () => {
    // PDF export would use a library like jsPDF or server-side PDF generation
    const response = await fetch('/api/export/pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, filename })
    });
    return await response.blob();
  };

  const exportToCSV = () => {
    const headers = Object.keys(data[0] || {});
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => JSON.stringify(row[header] || '')).join(',')
      )
    ].join('\n');

    return new Blob([csv], { type: 'text/csv' });
  };

  const exportToExcel = async () => {
    const response = await fetch('/api/export/excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data, filename })
    });
    return await response.blob();
  };

  const exportToJSON = () => {
    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: 'application/json' });
  };

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    try {
      let blob: Blob | void;

      if (onExport) {
        blob = await onExport(format, data);
      } else {
        switch (format) {
          case 'pdf':
            blob = await exportToPDF();
            break;
          case 'csv':
            blob = exportToCSV();
            break;
          case 'excel':
            blob = await exportToExcel();
            break;
          case 'json':
            blob = exportToJSON();
            break;
        }
      }

      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
          title: "Export successful",
          description: `Downloaded as ${filename}.${format}`,
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatConfig = {
    pdf: { icon: FileText, label: 'PDF Document' },
    csv: { icon: FileSpreadsheet, label: 'CSV File' },
    excel: { icon: FileSpreadsheet, label: 'Excel Spreadsheet' },
    json: { icon: FileJson, label: 'JSON Data' },
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting || data.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.map(format => {
          const config = formatConfig[format];
          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
            >
              <config.icon className="h-4 w-4 mr-2" />
              {config.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
