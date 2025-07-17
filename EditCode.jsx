import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCodeById, updateCode } from '../../api/codeApi';
import { FiChevronLeft, FiSave, FiX, FiLoader } from 'react-icons/fi';

const EditCode = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    code_name: '',
    code_purpose: '',
    code_color: '#3B82F6',
    code_icon: '🔧',
    status: 'active'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Predefined color options
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6B7280'
  ];

  // Predefined icon options
  const iconOptions = [
    '🔧', '⚙️', '🛠️', '📊', '🔐', '🌐', '💻', '📱', '🔍', '📈',
    '🎯', '🚀', '💡', '🔔', '📄', '🔒', '🌟', '⚡', '🎨', '🔗'
  ];

  useEffect(() => {
    console.log("EditCode component mounted with ID:");
    fetchCode();
  }, [id]);

  const fetchCode = async () => {
    try {
      setLoading(true);
      const response = await getCodeById(id);
      console.log("Fetched Code Edit Code:", response);
      setFormData({
        code_name: response.data.code_name || '',
        code_purpose: response.data.code_purpose || '',
        code_color: response.data.code_color || '#3B82F6',
        code_icon: response.data.code_icon || '🔧',
        status: response.data.status || 'active'
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch code details. Please try again.');
      console.error('Fetch code error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.code_name.trim()) {
      setError('Code name is required');
      return;
    }
    
    if (!formData.code_purpose.trim()) {
      setError('Code purpose is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      try {
    const codeId = id; // This should come from useParams()
    
    if (!codeId) {
      throw new Error('Code ID is missing');
    }
    
    // Call the API with the ID and form data
    const response = await updateCode(codeId, formData);
    
    if (response.success) {      
      navigate('/codes'); // or wherever you want to redirect
    }
  } catch (error) {
    console.error('Update code error:', error);
    // Handle error - show error message to user
    setError(error.message || 'Failed to update code');
  }
      setSuccess(true);      
          
    } catch (err) {
      setError('Failed to update code. Please try again.');
      console.error('Update code error:', err);
    } finally {
      setSaving(false);
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
          <h1 className="text-2xl font-bold text-gray-800">Edit Code</h1>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            <p className="font-medium">Success!</p>
            <p>Code updated successfully. Redirecting...</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Code Name */}
            <div>
              <label htmlFor="code_name" className="block text-sm font-medium text-gray-700 mb-2">
                Code Name *
              </label>
              <input
                type="text"
                id="code_name"
                name="code_name"
                value={formData.code_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter code name"
                required
              />
            </div>

            {/* Code Purpose */}
            <div>
              <label htmlFor="code_purpose" className="block text-sm font-medium text-gray-700 mb-2">
                Code Purpose *
              </label>
              <textarea
                id="code_purpose"
                name="code_purpose"
                value={formData.code_purpose}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the purpose of this code"
                required
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Color
              </label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, code_color: color }))}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.code_color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <input
                type="color"
                value={formData.code_color}
                onChange={(e) => setFormData(prev => ({ ...prev, code_color: e.target.value }))}
                className="mt-2 w-16 h-8 rounded border border-gray-300"
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, code_icon: icon }))}
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg ${
                      formData.code_icon === icon ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview
              </label>
              <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                <div 
                  className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white mr-3"
                  style={{ backgroundColor: formData.code_color }}
                >
                  {formData.code_icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900">{formData.code_name.toUpperCase() || 'CODE NAME'}</div>
                  <div className="text-sm text-gray-500">{formData.code_purpose || 'Code purpose description'}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <FiLoader className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave />
                    Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                <FiX />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditCode;