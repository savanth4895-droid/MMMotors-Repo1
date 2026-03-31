import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { Button } from './ui/button';
import {
  Upload, Download, FileText, Users, Car, Wrench, Package,
  CheckCircle, AlertCircle, Clock, X, Eye, RefreshCw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DATA_TYPES = [
  {
    value: 'customers', label: 'Customers', icon: Users, color: 'blue',
    description: 'Personal details, vehicle info, insurance & sales records',
    fieldGroups: [
      { label: 'Customer', color: 'blue',   fields: ['name', 'care_of', 'mobile', 'phone', 'email', 'address'] },
      { label: 'Vehicle',  color: 'green',  fields: ['vehicle_brand', 'vehicle_model', 'vehicle_color', 'vehicle_no', 'chassis_no', 'engine_no'] },
      { label: 'Insurance',color: 'purple', fields: ['insurance_nominee', 'insurance_relation', 'insurance_age'] },
      { label: 'Sale',     color: 'orange', fields: ['sale_amount', 'payment_method', 'hypothecation', 'sale_date', 'invoice_number'] },
    ]
  },
  {
    value: 'vehicles', label: 'Vehicles', icon: Car, color: 'green',
    description: 'Stock data — auto-links customers & creates sale records',
    fieldGroups: [
      { label: 'Vehicle', color: 'green',  fields: ['date_received', 'brand', 'model', 'chassis_number', 'engine_number', 'color', 'vehicle_number', 'key_number', 'status'] },
      { label: 'Sale',    color: 'orange', fields: ['customer_mobile', 'customer_name', 'sale_amount', 'payment_method', 'inbound_location', 'page_number'] },
    ]
  },
  {
    value: 'spare_parts', label: 'Spare Parts', icon: Package, color: 'amber',
    description: 'Parts inventory with pricing, GST and compatible models',
    fieldGroups: [
      { label: 'Part', color: 'amber', fields: ['name', 'part_number', 'brand', 'quantity', 'unit', 'unit_price', 'hsn_sac', 'gst_percentage', 'supplier', 'compatible_models'] },
    ]
  },
  {
    value: 'service_history', label: 'Service History', icon: Wrench, color: 'indigo',
    description: 'All service data in one — customer, vehicle, registration, job card & billing',
    fieldGroups: [
      { label: 'Customer',     color: 'blue',   fields: ['customer_name', 'customer_mobile', 'customer_address'] },
      { label: 'Vehicle',      color: 'green',  fields: ['vehicle_number', 'vehicle_brand', 'vehicle_model', 'vehicle_year', 'chassis_number', 'engine_number'] },
      { label: 'Service',      color: 'indigo', fields: ['service_date', 'service_type', 'description', 'job_card_number', 'status'] },
      { label: 'Bill (optional)', color: 'amber', fields: ['bill_date', 'item_description', 'item_qty', 'item_rate', 'item_gst_percent', 'total_amount'] },
    ]
  },
  {
    value: 'service_bills', label: 'Service Bills', icon: FileText, color: 'rose',
    description: 'Service billing records — one row per line item, grouped by job card',
    fieldGroups: [
      { label: 'Bill', color: 'rose', fields: ['bill_date', 'job_card_number', 'status'] },
      { label: 'Customer & Vehicle', color: 'blue', fields: ['customer_name', 'customer_mobile', 'vehicle_number', 'vehicle_brand', 'vehicle_model'] },
      { label: 'Line Item', color: 'green', fields: ['item_description', 'item_hsn', 'item_qty', 'item_rate', 'item_gst_percent'] },
      { label: 'Total (optional)', color: 'amber', fields: ['total_amount'] },
    ]
  },
];

const C = {
  blue:   { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',    icon: 'text-blue-500',   ring: 'ring-blue-400'   },
  green:  { bg: 'bg-green-50',  border: 'border-green-200',  text: 'text-green-700',  badge: 'bg-green-100 text-green-700',  icon: 'text-green-500',  ring: 'ring-green-400'  },
  amber:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  badge: 'bg-amber-100 text-amber-700',  icon: 'text-amber-500',  ring: 'ring-amber-400'  },
  rose:   { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   badge: 'bg-rose-100 text-rose-700',    icon: 'text-rose-500',   ring: 'ring-rose-400'   },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700',icon: 'text-purple-500', ring: 'ring-purple-400' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700',icon: 'text-orange-500', ring: 'ring-orange-400' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700',icon: 'text-indigo-500', ring: 'ring-indigo-400' },
  teal:   { bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700',   badge: 'bg-teal-100 text-teal-700',   icon: 'text-teal-500',   ring: 'ring-teal-400'   },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700',icon: 'text-violet-500', ring: 'ring-violet-400' },
};

function StatusIcon({ status }) {
  if (status === 'completed') return <CheckCircle className="w-4 h-4 text-green-500" />;
  if (status === 'failed')    return <AlertCircle className="w-4 h-4 text-red-500" />;
  return <Clock className="w-4 h-4 text-yellow-500" />;
}

function StatusBadge({ status }) {
  const m = { completed: 'bg-green-100 text-green-800', failed: 'bg-red-100 text-red-800', processing: 'bg-yellow-100 text-yellow-800' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${m[status] || 'bg-gray-100 text-gray-700'}`}>{status}</span>;
}

function JobDetailsModal({ job, onClose }) {
  if (!job) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[88vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{job.file_name}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{job.data_type.replace('_', ' ')} · {new Date(job.created_at).toLocaleString()}</p>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-500" /></button>
          </div>
          <div className="grid grid-cols-5 gap-3 mb-5">
            {[
              { label: 'Total',     value: job.total_records,      col: 'blue'   },
              { label: 'Success',   value: job.successful_records, col: 'green'  },
              { label: 'Skipped',   value: job.skipped_records||0, col: 'amber'  },
              { label: 'Failed',    value: job.failed_records,     col: 'rose'   },
              { label: 'Processed', value: job.processed_records,  col: 'purple' },
            ].map(({ label, value, col }) => (
              <div key={label} className={`text-center p-3 rounded-lg ${C[col].bg}`}>
                <div className={`text-2xl font-bold ${C[col].text}`}>{value}</div>
                <div className={`text-xs mt-0.5 ${C[col].text}`}>{label}</div>
              </div>
            ))}
          </div>
          {job.skipped_records > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-amber-800 mb-1 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{job.skipped_records} Duplicates Skipped</h4>
              <p className="text-sm text-amber-700">Detected by unique identifiers (mobile / chassis / part number).</p>
            </div>
          )}
          {job.cross_reference_stats && Object.keys(job.cross_reference_stats).length > 0 && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2"><RefreshCw className="w-4 h-4" />Cross-Reference</h4>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(job.cross_reference_stats).filter(([,v]) => v > 0).map(([k, v]) => (
                  <div key={k} className="text-center p-2 bg-white rounded border border-purple-100">
                    <div className="text-lg font-bold text-purple-600">{v}</div>
                    <div className="text-xs text-purple-700">{k.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {job.incomplete_records?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" />Incomplete ({job.incomplete_records.length})</h4>
              <div className="max-h-40 overflow-y-auto space-y-1.5">
                {job.incomplete_records.slice(0, 10).map((r, i) => (
                  <div key={i} className="bg-white border border-yellow-200 rounded px-3 py-2 text-sm">
                    <span className="font-medium text-yellow-800">Row {r.row}</span>
                    <span className="text-yellow-600 ml-2">Missing: {r.missing_fields.join(', ')}</span>
                  </div>
                ))}
                {job.incomplete_records.length > 10 && <p className="text-center text-xs text-yellow-600">+{job.incomplete_records.length - 10} more</p>}
              </div>
            </div>
          )}
          {job.errors?.length > 0 && (
            <div>
              <h4 className="font-semibold text-red-700 mb-2">Errors ({job.errors.length})</h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {job.errors.map((e, i) => (
                  <div key={i} className="bg-red-50 border border-red-200 rounded px-3 py-2 text-sm">
                    <span className="font-medium text-red-800">Row {e.row}</span>
                    <span className="text-red-600 ml-2">{e.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end"><Button onClick={onClose}>Close</Button></div>
        </div>
      </div>
    </div>
  );
}

const DataImport = () => {
  const [selectedType, setSelectedType] = useState(null);
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importJobs, setImportJobs] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => { fetchImportJobs(); }, []);

  const fetchImportJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/import/jobs`, { timeout: 300000, headers: { Authorization: `Bearer ${token}` } });
      setImportJobs(res.data);
    } catch { /* silent */ }
  };

  const handleFileSelect = (f) => {
    if (!f) return;
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!['.csv', '.xlsx', '.xls'].includes(ext)) { toast.error('Please select a CSV or Excel file'); return; }
    setFile(f);
    setImportResult(null);
  };

  const handleImport = async () => {
    if (!file || !selectedType) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API}/import/upload?data_type=${selectedType}`, formData, {
        timeout: 300000,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      });
      setImportResult({ success: res.data.status === 'completed', message: res.data.message });
      if (res.data.status === 'completed') toast.success(res.data.message);
      else toast.error(res.data.message);
      await fetchImportJobs();
    } catch (e) {
      const msg = e.response?.data?.detail || 'Import failed';
      toast.error(msg);
      setImportResult({ success: false, message: msg });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    if (!selectedType) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API}/import/template/${selectedType}`, {
        timeout: 300000, headers: { Authorization: `Bearer ${token}` }, responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url; a.download = `${selectedType}_template.csv`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); window.URL.revokeObjectURL(url);
      toast.success('Template downloaded');
    } catch { toast.error('Failed to download template'); }
  };

  const reset = () => { setFile(null); setImportResult(null); };
  const typeInfo = DATA_TYPES.find(d => d.value === selectedType);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Import</h1>
          <p className="text-sm text-gray-500 mt-0.5">Import existing data into MMMotors</p>
        </div>
        <button
          onClick={() => { setShowHistory(h => !h); fetchImportJobs(); }}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          <Clock className="w-4 h-4" />
          History
          {importJobs.length > 0 && (
            <span className="bg-gray-200 text-gray-700 rounded-full px-1.5 py-0.5 text-xs font-medium">{importJobs.length}</span>
          )}
        </button>
      </div>

      {/* History */}
      {showHistory && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
            <h3 className="font-semibold text-gray-700 text-sm">Import History</h3>
            <button onClick={fetchImportJobs} className="text-gray-400 hover:text-gray-600 transition-colors"><RefreshCw className="w-4 h-4" /></button>
          </div>
          {importJobs.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-2" />
              <p className="text-sm">No imports yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {importJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <StatusIcon status={job.status} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{job.file_name}</p>
                      <p className="text-xs text-gray-500">{job.data_type.replace('_', ' ')} · {new Date(job.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={job.status} />
                    {job.status === 'completed' && (
                      <span className="text-xs text-gray-500">{job.successful_records}/{job.total_records} ok</span>
                    )}
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 1 — Type */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">1 · What are you importing?</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {DATA_TYPES.map(dt => {
            const Icon = dt.icon;
            const c = C[dt.color];
            const active = selectedType === dt.value;
            return (
              <button
                key={dt.value}
                onClick={() => { setSelectedType(dt.value); reset(); }}
                className={`text-left p-4 rounded-xl border-2 transition-all ${
                  active ? `${c.bg} ${c.border} ring-2 ${c.ring}` : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-6 h-6 mb-2 ${active ? c.icon : 'text-gray-400'}`} />
                <p className={`font-semibold text-sm ${active ? c.text : 'text-gray-700'}`}>{dt.label}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{dt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2 — Fields + template */}
      {typeInfo && (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">2 · Fields in this template</p>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Template (.csv)
            </button>
          </div>
          <div className="p-4 space-y-3">
            {typeInfo.fieldGroups.map(group => {
              const c = C[group.color];
              return (
                <div key={group.label}>
                  <p className={`text-xs font-semibold mb-1.5 ${c.text}`}>{group.label}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {group.fields.map(f => (
                      <span key={f} className={`text-xs px-2 py-0.5 rounded-md font-mono ${c.badge}`}>{f}</span>
                    ))}
                  </div>
                </div>
              );
            })}
            <p className="text-xs text-gray-400 pt-1">Fields can be left empty if not available.</p>
          </div>
        </div>
      )}

      {/* Step 3 — Upload */}
      {typeInfo && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">3 · Upload your file</p>

          {importResult && (
            <div className={`flex items-start gap-3 p-4 rounded-xl mb-4 ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {importResult.success
                ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                : <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />}
              <div className="flex-1">
                <p className={`font-medium text-sm ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {importResult.success ? 'Import complete' : 'Import failed'}
                </p>
                <p className={`text-xs mt-0.5 ${importResult.success ? 'text-green-700' : 'text-red-700'}`}>{importResult.message}</p>
              </div>
              <button onClick={reset}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>
            </div>
          )}

          <div
            className={`border-2 border-dashed rounded-xl transition-colors ${
              dragOver ? 'border-blue-400 bg-blue-50' :
              file     ? 'border-green-400 bg-green-50' :
                         'border-gray-300 hover:border-gray-400 bg-gray-50/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />

            {file ? (
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-green-800 text-sm">{file.name}</p>
                    <p className="text-xs text-green-600">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleImport} disabled={importing} className="bg-green-600 hover:bg-green-700 text-white">
                    {importing
                      ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Importing...</>
                      : <><Upload className="w-4 h-4 mr-2" />Import Now</>}
                  </Button>
                  <button onClick={reset} disabled={importing} className="p-2 rounded-lg hover:bg-green-200 text-green-700 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 text-center">
                <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Drop your file here</p>
                <p className="text-sm text-gray-400 mt-1">CSV, XLSX, or XLS</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  Browse files
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedJob && <JobDetailsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  );
};

export default DataImport;
