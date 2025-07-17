import { apiHelper } from './apiHelper';

//let codesData = [];

export const getAllCodes = async () => {
  try {
    const response = await apiHelper.get("vconnect/codes");
    //console.log("Fetched Codes:", response);
   // codesData = response.data || [];
    return response;
  } catch (error) {
    console.error("Failed to fetch branches:", error);
    throw new Error("Unable to retrieve branches. Please try again.");
  }
};

//export const getCodeById = (id) => codesData.find(code => code.id === id) || null;

export const getCodeById = async (id) => {
  try {
    console.log("API_CODE_API: Fetching code by ID:", id);
    const response = await apiHelper.get(`vconnect/codes/${id}`);
    console.log("Fetched Code by ID:", response);
    return response;
  } catch (error) {
    console.error("Error fetching code by ID:", error);
    throw error;
  }
};


export const addNewCode = async (codeData) => {
  try {
    const response = await apiHelper.post('vconnect/codes', codeData);
    return response.data;
  } catch (error) {
    console.error('Add code error:', error);
    throw error;
  }
};

export const updateCode = async (id, codeData) => {
  try {
      
    // Include the ID in the request body
    const dataWithId = {
      ...codeData,
      id: id  // Add the ID to the request body
    };
    
    const response = await apiHelper.put(`vconnect/codes/${id}`, dataWithId);
    
    if (response.success) {
      console.log('Code updated successfully:', response);
      return response;
    } else {
      console.log('Failed to update code:', response);
      throw new Error(response.message || 'Unable to update code. Please try again.');
    }
  } catch (error) {
    console.error('Error updating code:', error);
    throw new Error('Unable to update code. Please try again.');
  }
};

export const deleteCode = async (id) => {
  try {
    const response = await apiHelper.delete(`vconnect/codes/${id}`);
    return response;
  } catch (error) {
    console.error("Failed to delete branch:", error);
    throw new Error("Unable to delete branch. Please try again.");
  }
};

/**
 * Deactivate a code with audio and remarks
 * @param {Object} payload - { auditId, remarks, fileUri }
 */
export const deactivateCode = async ({ auditId, remarks, fileUri }) => {
  const id = typeof auditId === "object" ? auditId.id : auditId;
  const fileName = fileUri.split('/').pop();
  const fileType = "audio/m4a";

  const formData = new FormData();
  formData.append("file", {
    uri: fileUri,
    name: fileName,
    type: fileType,
  });
  formData.append("notes", remarks);

  try {
    const response = await apiHelper.post(
      `vconnect/audio/deactivation-upload/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  } catch (error) {
    console.error("❌ Failed to deactivate code:", error.response?.data || error.message);
    throw new Error("Failed to deactivate code");
  }
};


/**
 * Explicit code activation (for Tenant Admin activating without audio)
 * @param {Object} payload - { codeId, userBranchMappingId }
 */
export const activateCode = async (payload) => {
  try {
    return await apiHelper.post("vconnect/code/activate", payload);
  } catch (error) {
    console.error("❌ Failed to activate code:", error);
    throw new Error("Code activation failed");
  }
};



// export const deleteCode = async (id) => {
//   try {
//     await apiHelper.post("vconnect/codes", {id});
//     //return await apiHelper.delete(`/codes/${id}`);
//   } catch (error) {
//      console.error("❌ Failed to activate code:", error);
//     throw error;
//   }
// };


