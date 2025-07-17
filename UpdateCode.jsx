import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllCodes } from '../../api/codeApi';
import { FiSearch, FiRefreshCw, FiChevronLeft, FiGrid, FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';

const UpdateCode = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [notification, setNotification] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check for notification from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setNotification({
        message: location.state.message,
        type: location.state.type || 'info'
      });
      
      // Clear notification after 5 seconds
      setTimeout(() => {
        setNotification(null);
      }, 5000);
      
      // Clear the location state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const response = await getAllCodes();
      console.log("Fetched ALl Codes:", response);
      setCodes(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch codes. Please try again.');
      console.error('Fetch codes error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  // Filter codes based on search term
  const filteredCodes = codes.filter(code => {
    const searchLower = searchTerm.toLowerCase();
    return (
      code.id.toLowerCase().includes(searchLower) ||
      code.code_name.toLowerCase().includes(searchLower) ||
      code.code_purpose.toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCodes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCodes.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleEdit = (codeId) => {
    console.log("Editing code with ID:", codeId);
    navigate(`/codes/edit/${codeId}`);
  };

  const handleDelete = async (codeId) => {
    if (!window.confirm('Are you sure you want to delete this code? This action cannot be undone.')) {
      return;
    }   
    navigate(`/codes/delete/${codeId}`);
  
  }

  const handleAddNew = () => {
    navigate('/codes/add');
  };

  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Notification */}
        {notification && (
          <div className={`mb-6 p-4 rounded-lg flex items-center justify-between ${
            notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-blue-100 text-blue-800 border border-blue-200'
          }`}>
            <span>{notification.message}</span>
            <button
              onClick={closeNotification}
              className="ml-4 text-gray-500 hover:text-gray-700"
            >
              <FiX />
            </button>
          </div>
        )}

        {/* Header with navigation buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full hover:bg-gray-200"
              title="Go back"
            >
              <FiChevronLeft className="text-xl" />
            </button>
            <button
              onClick={() => navigate('/codes')}
              className="mr-4 p-2 rounded-full hover:bg-gray-200"
              title="Return to Codes Dashboard"
            >
              <FiGrid className="text-xl" />
            </button>
            <h1 className="text-2xl font-bold text-gray-800">All System Codes</h1>
          </div>
          
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus /> Add New Code
          </button>
        </div>

        {/* Search and filter section */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by ID, name, or purpose..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchCodes}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Status indicators */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p>{error}</p>
            <button
              onClick={fetchCodes}
              className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {currentItems.length > 0 ? (
              <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map((code) => (
                        <tr key={code.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div 
                                className="flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: code.code_color }}
                              >
                                {code.code_icon}
                              </div>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">{(code.code_name).toUpperCase()}</div>
                                <div className="text-sm text-gray-500 font-mono">{code.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{code.code_purpose}</div>
                            <div className="text-sm text-gray-500">{new Date(code.updated_at).toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              code.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {code.status || 'active'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => handleEdit(code.id)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                title="Edit code"
                              >
                                <FiEdit2 className="mr-1" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(code.id)}
                                disabled={deleteLoading === code.id}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-5 font-medium rounded-md text-red-600 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Delete code"
                              >
                                {deleteLoading === code.id ? (
                                  <>
                                    <FiRefreshCw className="mr-1 animate-spin" /> Deleting...
                                  </>
                                ) : (
                                  <>
                                    <FiTrash2 className="mr-1" /> Delete
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <p className="text-gray-500">
                  {searchTerm 
                    ? `No codes found matching "${searchTerm}"`
                    : 'No codes found in the system'}
                </p>
                <button
                  onClick={handleAddNew}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Your First Code
                </button>
              </div>
            )}

            {/* Pagination */}
            {filteredCodes.length > itemsPerPage && (
              <div className="flex justify-between items-center bg-white px-6 py-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredCodes.length)}
                  </span> of{' '}
                  <span className="font-medium">{filteredCodes.length}</span> results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                    <button
                      key={number}
                      onClick={() => paginate(number)}
                      className={`px-3 py-1 border rounded-md text-sm font-medium ${
                        currentPage === number
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UpdateCode;