import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCodeById, deleteCode } from '../../api/codeApi';
import { FiChevronLeft, FiTrash2, FiX, FiAlertTriangle, FiLoader } from 'react-icons/fi';

const DeleteCode = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [codeData, setCodeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    fetchCode();
  }, [id]);

  const fetchCode = async () => {
    try {
      setLoading(true);
      const response = await getCodeById(id);
      setCodeData(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch code details. Please try again.');
      console.error('Fetch code error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      setError('Please type "DELETE" to confirm deletion');
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      
      await deleteCode(id);
      
      // Show success message and redirect
      navigate('/codes', { 
        state: { 
          message: 'Code deleted successfully',
          type: 'success' 
        }
      });
      
    } catch (err) {
      setError('Failed to delete code. Please try again.');
      console.error('Delete code error:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    navigate('/codes');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !codeData) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
            <p>{error}</p>
            <button
              onClick={fetchCode}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
            title="Go back"
          >
            <FiChevronLeft className="text-xl" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Delete Code</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Warning Card */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <FiAlertTriangle className="text-red-500 text-2xl mr-3" />
            <h2 className="text-lg font-semibold text-red-800">Warning</h2>
          </div>
          <p className="text-red-700 mb-4">
            This action cannot be undone. This will permanently delete the code and all associated data.
          </p>
        </div>

        {/* Code Preview */}
        {codeData && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Code to be deleted:</h3>
            
            <div className="flex items-center p-4 bg-gray-50 rounded-lg mb-4">
              <div 
                className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white mr-4"
                style={{ backgroundColor: codeData.code_color }}
              >
                {codeData.code_icon}
              </div>
              <div>
                <div className="font-medium text-gray-900">{codeData.code_name.toUpperCase()}</div>
                <div className="text-sm text-gray-500 font-mono">{codeData.id}</div>
                <div className="text-sm text-gray-600 mt-1">{codeData.code_purpose}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  codeData.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {codeData.status || 'active'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(codeData.updated_at).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type "DELETE" to confirm deletion:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Type DELETE here"
            />
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="confirm-checkbox"
              checked={showConfirmation}
              onChange={(e) => setShowConfirmation(e.target.checked)}
              className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
            />
            <label htmlFor="confirm-checkbox" className="ml-2 block text-sm text-gray-700">
              I understand that this action cannot be undone
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleDelete}
              disabled={deleting || confirmText !== 'DELETE' || !showConfirmation}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleting ? (
                <>
                  <FiLoader className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <FiTrash2 />
                  Delete Code
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              <FiX />
              Cancel
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What happens when you delete this code?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• The code will be permanently removed from the system</li>
            <li>• All associated data will be deleted</li>
            <li>• This action cannot be reversed</li>
            <li>• You will need to recreate the code if needed again</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DeleteCode;