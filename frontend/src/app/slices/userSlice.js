import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: 'user',
    initialState: {
        user:null,
        role:null,
        isAuthenticated: false,
    },
    reducers: {
        userLogin(state, action) {
            return {
                ...state,
                isAuthenticated: true,
                user: action.payload.user,
                role: action.payload.role,
            }
        },
        userLogout(state) {
            // Clear the redux state
            state.isAuthenticated = false;
            state.user = null;
            state.role = null;
            // Clear the persisted state in localStorage
            localStorage.clear();
            // You might want to preserve some non-sensitive data in localStorage
            // If so, only remove specific items instead of clearing everything
            // localStorage.removeItem('persist:root');
        },
        updateUserProfile(state, action) {
            return {
                ...state,
                user: action.payload,
            };
        },
    }
});


export const { userLogin, userLogout, updateUserProfile } = userSlice.actions;
export default userSlice.reducer;
