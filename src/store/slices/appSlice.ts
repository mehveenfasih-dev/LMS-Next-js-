import { createSlice } from "@reduxjs/toolkit";

const appSlice = createSlice({
  name: "app",
  initialState: { pendingRequests: 0 },
  reducers: {
    showLoader(state) {
      state.pendingRequests += 1;
    },
    hideLoader(state) {
      state.pendingRequests = Math.max(0, state.pendingRequests - 1);
    },
  },
});

export const { showLoader, hideLoader } = appSlice.actions;
export const selectIsLoading = (state: { app: { pendingRequests: number } }) =>
  state.app.pendingRequests > 0;
export default appSlice.reducer;
