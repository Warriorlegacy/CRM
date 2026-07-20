'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import {
  Upload, Download, FileText, CheckCircle, XCircle, AlertCircle,
  Loader2, Users, MessageSquare, ArrowUpFromLine, Database, 
  Shield, ChevronDown, Info, Clock, Table2
} from 'lucide-react';

interface ImportHistory {
  id: string;
  type: string;
  fileName: string;
  importedCount: number;
  failedCount: number;
  errors: string | null;
  createdAt: string;
}

export default function ImportExportPage() {
  const { user, workspace, isLoading: authLoading } = useAuth();
  const { addNotification } = useNotification();
  const USER_ID = user?.id || '';
  const WORKSPACE_ID = workspace?.id || '';
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistory[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const headers = {
    'x-user-id': USER_ID,
    'x-workspace-id': WORKSPACE_ID,
  };

  useEffect(() => {
    if (!USER_ID || !WORKSPACE_ID || authLoading) return;
    loadImportHistory();
  }, [USER_ID, WORKSPACE_ID, authLoading]);

  const loadImportHistory = async () => {
    try {
      // In production, this would call a real API
      setImportHistory([]);
    } catch (error) {
      console.error('Failed to load import history:', error);
    }
  };

  const handleExport = async (type: 'contacts' | 'conversations' | 'messages') => {
    setExporting(type);
    try {
      const token = localStorage.getItem('auth_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/v1/export/${type}/csv`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-id': USER_ID,
          'x-workspace-id': WORKSPACE_ID,
        },
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addNotification({ type: 'success', title: `${type} exported successfully!` });
    } catch (error) {
      addNotification({ type: 'error', title: 'Export failed' });
    } finally {
      setExporting(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      setSelectedFile(file);
    } else {
      addNotification({ type: 'error', title: 'Please upload a CSV file' });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const token = localStorage.getItem('auth_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${baseUrl}/api/v1/import/contacts/csv`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'x-user-id': USER_ID,
          'x-workspace-id': WORKSPACE_ID,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setImportResult({ success: data.imported || 0, failed: data.failed || 0, errors: data.errors || [] });
        addNotification({ type: 'success', title: `Imported ${data.imported || 0} contacts!` });
      } else {
        setImportResult({ success: 0, failed: data.failed || 0, errors: data.errors || [data.error || 'Import failed'] });
        addNotification({ type: 'error', title: data.error || 'Import failed' });
      }
    } catch (error: any) {
      setImportResult({ success: 0, failed: 1, errors: [error.message || 'Import failed'] });
      addNotification({ type: 'error', title: 'Import failed' });
    } finally {
      setImporting(false);
      setSelectedFile(null);
    }
  };

  const exportOptions = [
    {
      id: 'contacts' as const,
      label: 'Contacts',
      description: 'All contacts with name, phone, email, stage, tags, and assignment info',
      icon: Users,
      filename: `contacts-${new Date().toISOString().split('T')[0]}.csv`,
      color: 'bg-blue-500/20 text-blue-400',
      borderColor: 'hover:border-blue-500/30',
    },
    {
      id: 'conversations' as const,
      label: 'Conversations',
      description: 'Conversation history with contact info, status, last message, and activity',
      icon: MessageSquare,
      filename: `conversations-${new Date().toISOString().split('T')[0]}.csv`,
      color: 'bg-purple-500/20 text-purple-400',
      borderColor: 'hover:border-purple-500/30',
    },
    {
      id: 'messages' as const,
      label: 'Messages',
      description: 'All message data with date, direction, type, content, and sender',
      icon: MessageSquare,
      filename: `messages-${new Date().toISOString().split('T')[0]}.csv`,
      color: 'bg-emerald-500/20 text-emerald-400',
      borderColor: 'hover:border-emerald-500/30',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Database className="w-7 h-7 text-emerald-400" />
            Import & Export
          </h1>
          <p className="text-zinc-500">Manage your workspace data - import contacts and export reports</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-1.5 w-fit">
        <button
          onClick={() => setActiveTab('export')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'export'
              ? 'bg-zinc-800 text-white shadow-lg'
              : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'import'
              ? 'bg-zinc-800 text-white shadow-lg'
              : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
          }`}
        >
          <Upload className="w-4 h-4" />
          Import Contacts
        </button>
      </div>

      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="glass-panel-strong rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Export Your Data</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Download your workspace data as CSV files. Compatible with Excel, Google Sheets, and all data analysis tools.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleExport(option.id)}
                  disabled={exporting === option.id}
                  className={`p-6 bg-zinc-800/30 border border-zinc-700 rounded-2xl ${option.borderColor} hover:bg-zinc-800/50 transition-all group text-left disabled:opacity-50`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl ${option.color} group-hover:scale-105 transition-transform`}>
                      {exporting === option.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <option.icon className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                  <h4 className="font-medium text-white mb-1">{option.label}</h4>
                  <p className="text-xs text-zinc-500 mb-4">{option.description}</p>
                  <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                    <FileText className="w-3 h-3" />
                    {option.filename}
                  </div>
                </button>
              ))}
            </div>

            {/* Data summary */}
            <div className="mt-6 p-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Info className="w-4 h-4 text-zinc-500" />
                <span className="text-sm text-zinc-400">About CSV Export</span>
              </div>
              <ul className="space-y-1 text-xs text-zinc-500">
                <li>• Files are generated in real-time from your current workspace data</li>
                <li>• CSV format is compatible with Excel, Google Sheets, and Numbers</li>
                <li>• UTF-8 encoding with BOM for proper character support</li>
                <li>• Export limits: up to 10,000 records per export</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'import' && (
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="glass-panel-strong rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Import Contacts from CSV</h3>
            <p className="text-sm text-zinc-500 mb-6">
              Upload a CSV file to bulk-import contacts into your workspace.
            </p>

            {/* Format guide */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mb-6">
              <h4 className="text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
                <Table2 className="w-4 h-4" />
                Required CSV Format
              </h4>
              <p className="text-xs text-blue-300/70 mb-3">
                Your CSV file must have a header row with these columns. Only <strong>phone</strong> is required.
              </p>
              <div className="bg-zinc-950 rounded-lg p-3 overflow-x-auto">
                <code className="text-xs text-emerald-300 whitespace-nowrap">
                  name,phone,email,stage,tags<br />
                  John Doe,+911234567890,john@example.com,new,hot lead<br />
                  Jane Smith,+919876543210,,followup,warm
                </code>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                <div>
                  <span className="text-zinc-400">Columns:</span>
                  <ul className="text-zinc-500 mt-1 space-y-0.5">
                    <li><code className="text-emerald-400">name</code> - Contact name (optional)</li>
                    <li><code className="text-emerald-400">phone</code> - Phone number <span className="text-red-400">*required</span></li>
                    <li><code className="text-emerald-400">email</code> - Email address (optional)</li>
                  </ul>
                </div>
                <div>
                  <span className="text-zinc-400">&nbsp;</span>
                  <ul className="text-zinc-500 mt-1 space-y-0.5">
                    <li><code className="text-emerald-400">stage</code> - Pipeline stage (optional)</li>
                    <li><code className="text-emerald-400">tags</code> - Comma-separated tags (optional)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-500/5'
                  : selectedFile
                  ? 'border-emerald-500/50 bg-emerald-500/5'
                  : 'border-zinc-700 hover:border-zinc-600'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />

              {!selectedFile ? (
                <div className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <ArrowUpFromLine className={`w-12 h-12 mx-auto mb-4 ${dragOver ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  <p className="text-sm text-zinc-400 mb-1">
                    <span className="text-emerald-400 font-medium">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-zinc-600">CSV files only (max 10MB)</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium text-white mb-1">{selectedFile.name}</p>
                  <p className="text-xs text-zinc-500 mb-4">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => { setSelectedFile(null); setImportResult(null); }}
                      className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm hover:bg-zinc-700 transition-colors"
                    >
                      Remove
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      {importing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</>
                      ) : (
                        <><Upload className="w-4 h-4" /> Import Contacts</>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Import Result */}
          {importResult && (
            <div className={`glass-panel-strong rounded-2xl p-6 border ${
              importResult.failed > 0 && importResult.success === 0
                ? 'border-red-500/30'
                : importResult.failed > 0
                ? 'border-amber-500/30'
                : 'border-emerald-500/30'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {importResult.failed > 0 && importResult.success === 0 ? (
                  <XCircle className="w-6 h-6 text-red-400" />
                ) : importResult.failed > 0 ? (
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                )}
                <h3 className="text-lg font-semibold text-white">
                  Import {importResult.failed > 0 && importResult.success === 0 ? 'Failed' : 'Complete'}
                </h3>
              </div>
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">{importResult.success}</div>
                  <div className="text-xs text-zinc-500">Imported</div>
                </div>
                {importResult.failed > 0 && (
                  <div>
                    <div className="text-2xl font-bold text-red-400 font-mono">{importResult.failed}</div>
                    <div className="text-xs text-zinc-500">Failed</div>
                  </div>
                )}
              </div>
              {importResult.errors.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-xs text-red-300 font-medium mb-1">Errors:</p>
                  <ul className="space-y-0.5">
                    {importResult.errors.map((err, i) => (
                      <li key={i} className="text-xs text-red-200/70">{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Import History */}
          {importHistory.length > 0 && (
            <div className="glass-panel-strong rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Import History</h3>
              <div className="space-y-3">
                {importHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-zinc-500" />
                      <div>
                        <div className="text-sm text-white">{entry.fileName}</div>
                        <div className="text-xs text-zinc-500">
                          {entry.importedCount} imported, {entry.failedCount} failed
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-600">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Note */}
          <div className="flex items-center gap-3 p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="text-xs text-zinc-500">
              <span className="text-zinc-400 font-medium">Data Security:</span> Your data is processed securely. 
              Uploaded files are analyzed, validated, and imported within your workspace. No data is shared with third parties.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
