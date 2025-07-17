import { apiHelper } from './apiHelper';

/**
 * Register a new user
 * @param {Object} userData
 */
export const createUser = async (userData) => {
  try {
    const response = await apiHelper.post("auth/register", userData);
    return response;
  } catch (error) {
    console.error("Registration failed:", error);
    throw new Error("Failed to register user.");
  }
};

/**
 * Fetch all users (Branch/Tenant Admin)
 */
export const getAllUsers = async () => {
  try {
    const response = await apiHelper.get("auth/users");
    return response;
  } catch (error) {
    console.error("Failed to fetch users:", error);
    throw new Error("Unable to retrieve users.");
  }
};

//by id
export const getUserById= async (userId) => {
  try {
    const response = await apiHelper.get("auth/users/"+userId);
    if (!response) {
      throw new Error("User not found");
    }
    return {data: response}
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    throw new Error("Unable to fetch user profile.");
  }
};

/**
 * Update user profile
 * @param {Object} profileData
 */
export const updateUser = async (id,profileData) => {
  try {
    console.log('getting user data:', id, profileData);
    const response = await apiHelper.put(`auth/users/${id}`, profileData);
    console.log("response--->", response);
    return response;
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw new Error("Unable to update user profile.");
  }
};

export const deleteUser = async (id) => {
  try {
    const response = await apiHelper.delete(`auth/users/${id}`);
    return response;
  } catch (error) {
    console.error("Failed to update profile:", error);
    throw new Error("Unable to update user profile.");
  }
};


 export const changeUserPassword = async (id, oldPassword, newPassword) => {

    if (!oldPassword || !newPassword) {
   
    }

    // If passwords are stored in plain text — NOT RECOMMENDED
  if (user.password !== oldPassword) {
    throw new Error("Incorrect old password");
  }
  const response = await apiHelper.put(`auth/users/${id}/change-password`,newPassword);
  if (!response) throw new Error("User not found");

  //user.password = newPassword;
  //await user.save();
  return { message: "Password changed" };
}



