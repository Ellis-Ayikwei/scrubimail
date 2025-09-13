import React, { useState, useRef } from 'react';
import { 
  Upload, 
  File, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download,
  Trash2,
  Play,
  Pause,
  RefreshCw,
  FileText,
  Mail
} from 'lucide-react';

const BulkUpload: React.FC = () => {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.type === 'text/csv' || file.type === 'application/json' || file.name.endsWith('.txt')) {
        const newFile = {
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'uploaded',
          progress: 0,
          validCount: 0,
          invalidCount: 0,
          uploadedAt: new Date().toISOString()
        };
        setUploadedFiles(prev => [...prev, newFile]);
      }
    });
  };

  const startProcessing = (fileId: string) => {
    setProcessing(fileId);
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId 
          ? { ...file, status: 'processing', progress: 0 }
          : file
      )
    );

    // Simulate processing
    const interval = setInterval(() => {
      setUploadedFiles(prev => 
        prev.map(file => {
          if (file.id === fileId) {
            const newProgress = Math.min(file.progress + Math.random() * 15, 100);
            if (newProgress >= 100) {
              clearInterval(interval);
              setProcessing(null);
              return {
                ...file,
                status: 'completed',
                progress: 100,
                validCount: Math.floor(Math.random() * 800) + 200,
                invalidCount: Math.floor(Math.random() * 100) + 20
              };
            }
            return { ...file, progress: newProgress };
          }
          return file;
        })
      );
    }, 500);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'processing':
        return 'text-blue-600 dark:text-blue-400';
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'processing':
        return <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#333333] dark:text-white mb-2 flex items-center">
            <Upload className="w-8 h-8 mr-3 text-[#10B981]" />
            Bulk Email Upload
          </h1>
          <p className="text-[#333333]/70 dark:text-gray-400">
            Upload CSV, JSON, or TXT files to validate multiple email addresses at once
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Upload Section */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload Area */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-[#333333] dark:text-white mb-4">Upload Files</h2>
              
              <div
                className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-[#10B981] bg-[#10B981]/5'
                    : 'border-gray-300 dark:border-gray-600 hover:border-[#10B981]/50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".csv,.json,.txt"
                  onChange={handleChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[#333333] dark:text-white mb-2">
                  Drop files here or click to upload
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Support for CSV, JSON, and TXT files up to 50MB
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-[#10B981] text-white rounded-3xl hover:bg-[#059669] transition-colors"
                >
                  Choose Files
                </button>
              </div>

              {/* File Format Info */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Supported Formats:</h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• <strong>CSV:</strong> One email per line or comma-separated</li>
                  <li>• <strong>JSON:</strong> Array of email strings</li>
                  <li>• <strong>TXT:</strong> One email per line</li>
                </ul>
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-[#333333] dark:text-white mb-4">Uploaded Files</h2>
                
                <div className="space-y-4">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="border border-gray-200 dark:border-gray-700 rounded-3xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(file.status)}
                          <div>
                            <h4 className="font-medium text-[#333333] dark:text-white">{file.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {file.status === 'uploaded' && (
                            <button
                              onClick={() => startProcessing(file.id)}
                              disabled={processing !== null}
                              className="flex items-center space-x-1 px-3 py-1 bg-[#10B981] text-white rounded-3xl hover:bg-[#059669] disabled:opacity-50 text-sm"
                            >
                              <Play className="w-3 h-3" />
                              <span>Process</span>
                            </button>
                          )}
                          
                          {file.status === 'completed' && (
                            <button className="flex items-center space-x-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-3xl text-[#333333] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {file.status === 'processing' && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                            <span>Processing...</span>
                            <span>{Math.round(file.progress)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-[#10B981] h-2 rounded-full transition-all duration-500"
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {file.status === 'completed' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Valid: {file.validCount}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                            <XCircle className="w-4 h-4" />
                            <span className="text-sm">Invalid: {file.invalidCount}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <span className={`text-sm font-medium capitalize ${getStatusColor(file.status)}`}>
                          {file.status}
                        </span>
                        {file.status === 'completed' && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Accuracy: {Math.round((file.validCount / (file.validCount + file.invalidCount)) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4 flex items-center">
                <Mail className="w-5 h-5 mr-2 text-[#10B981]" />
                Today's Activity
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Files Processed</span>
                  <span className="font-medium text-[#333333] dark:text-white">12</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Emails Validated</span>
                  <span className="font-medium text-[#333333] dark:text-white">15,247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Success Rate</span>
                  <span className="font-medium text-green-600 dark:text-green-400">98.5%</span>
                </div>
              </div>
            </div>

            {/* Processing Queue */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">Processing Queue</h3>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No files in queue</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  Upload files to start processing
                </p>
              </div>
            </div>

            {/* Help */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#333333] dark:text-white mb-4">Need Help?</h3>
              <div className="space-y-3">
                <button className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="font-medium text-[#333333] dark:text-white">File Format Guide</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Learn about supported formats</div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="font-medium text-[#333333] dark:text-white">API Documentation</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Integrate bulk validation</div>
                </button>
                <button className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                  <div className="font-medium text-[#333333] dark:text-white">Download Samples</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Get example files</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;