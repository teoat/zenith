import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccessibleButton } from '@/components/ui/AccessibleButton';
import ErrorMessage from '@/components/ErrorMessage';
import { useApiError } from '@/hooks/useApiError';
import { UserRole } from '@/types/schema';
import FileDropZone from '@/components/ui/FileDropZone';
import { fileProcessingService } from '@/services/fileProcessing';

const Setup: React.FC = () => {
  const [step, setStep] = useState<'password' | 'role' | 'import'>('password');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('ANALYST');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const { error, handleError, clearError } = useApiError();
  const navigate = useNavigate();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (password.length < 12) {
      handleError({ message: 'Password must be at least 12 characters long', category: 'validation_error' });
      return;
    }

    if (password !== confirmPassword) {
      handleError({ message: 'Passwords do not match', category: 'validation_error' });
      return;
    }

    setStep('role');
  };

  const handleRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('import');
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      // Call Electron API to set master password
      const electronAPI = (window as typeof window & { electronAPI?: { auth?: { setMasterPassword: (pwd: string) => Promise<unknown> } } }).electronAPI;
      if (electronAPI?.auth?.setMasterPassword) {
        await electronAPI.auth.setMasterPassword(password);
      }

      // Store selected role for first user
      localStorage.setItem('firstUserRole', selectedRole);

      // Process uploaded files for case import
      if (uploadedFiles.length > 0) {
        const result = await fileProcessingService.processCaseImportFiles(uploadedFiles);

        if (!result.success || result.errors.length > 0) {
          const errorMessage = result.errors.length > 0
            ? `File processing completed with errors: ${result.errors.join(', ')}`
            : 'File processing failed';

          handleError({
            message: errorMessage,
            category: 'file_processing_error'
          });

          // Continue with setup even if file processing has errors
        }

        if (result.casesCreated > 0) {
          // Show success message for created cases
          console.log(`Successfully created ${result.casesCreated} cases from uploaded files`);
        }
      }

      // After setting, we can redirect to login or auto-login
      navigate('/login', { replace: true, state: { message: 'Setup complete. Please log in.' } });
    } catch (err: unknown) {
      const error = err as Error;
      handleError({ message: error.message || 'An error occurred', category: 'unknown_error' });
    } finally {
      setLoading(false);
    }
  };

  const handleFilesDropped = (files: File[]) => {
    setUploadedFiles(files);
  };

  const roleOptions = [
    {
      role: 'ANALYST' as UserRole,
      title: 'Fraud Analyst',
      description: 'Review alerts, analyze patterns, and support investigations',
      icon: '🔍'
    },
    {
      role: 'SENIOR_INVESTIGATOR' as UserRole,
      title: 'Senior Investigator',
      description: 'Lead complex cases, manage evidence, and coordinate responses',
      icon: '🕵️'
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'Administrator',
      description: 'Configure system settings, manage users, and oversee operations',
      icon: '⚙️'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Welcome to 378x492
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'password'
            ? 'Please set a Master Password to encrypt your local database.'
            : step === 'role'
            ? 'Choose your role to customize your experience.'
            : 'Import existing case files to get started quickly.'
          }
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === 'password' && (
            <form className="space-y-6" onSubmit={handlePasswordSubmit}>
              <ErrorMessage error={error || undefined} onDismiss={clearError} />

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Master Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Must be at least 12 characters long.
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <AccessibleButton
                  type="submit"
                  loading={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next: Choose Role
                </AccessibleButton>
              </div>
            </form>
          )}

          {step === 'role' && (
            <form className="space-y-6" onSubmit={handleRoleSubmit}>
              <ErrorMessage error={error || undefined} onDismiss={clearError} />

              <div className="space-y-4">
                {roleOptions.map((option) => (
                  <button
                    type="button"
                    key={option.role}
                    onClick={() => setSelectedRole(option.role)}
                    className={`w-full text-left p-4 border rounded-lg cursor-pointer transition-all ${
                      selectedRole === option.role
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{option.icon}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{option.title}</h3>
                        <p className="text-sm text-gray-600">{option.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('password')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <AccessibleButton
                  type="button"
                  onClick={() => setStep('import')}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next: Import Cases
                </AccessibleButton>
              </div>
            </form>
          )}

          {step === 'import' && (
            <form className="space-y-6" onSubmit={handleImportSubmit}>
              <ErrorMessage error={error || undefined} onDismiss={clearError} />

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Import Case Files (Optional)
                </h3>
                <FileDropZone
                  onFilesDropped={handleFilesDropped}
                  accept=".pdf,.docx,.xlsx,.csv,.jpg,.png,.tiff"
                  multiple={true}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors"
                />
                <p className="mt-2 text-xs text-gray-500">
                  Drag and drop case files here, or click to browse. Supported: PDF, DOCX, XLSX, CSV, images.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('role')}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <AccessibleButton
                  type="submit"
                  loading={loading}
                  className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {uploadedFiles.length > 0 ? `Import ${uploadedFiles.length} Files & Complete` : 'Skip Import & Complete'}
                </AccessibleButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setup;
