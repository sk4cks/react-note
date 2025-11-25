import { configureStore, createSlice } from "@reduxjs/toolkit";

let user = createSlice({
  name: "user",
  initialState: "kim",
});

let cartList = createSlice({
  name: "cartList",
  initialState: [
    { id: 0, name: "White and Black", count: 2 },
    { id: 2, name: "Grey Yordan", count: 1 },
  ],
  reducers: {
    countUp(state, action) {
      for (let i = 0; i < state.length; i++) {
        if (state[i].id === action.payload) {
          state[i].count++;
          break;
        }
      }
    },
    addList(state, action) {
      state.push(action.payload);
    },
  },
});

export let { countUp, addList } = cartList.actions;

export default configureStore({
  reducer: {
    user: user.reducer,
    cartList: cartList.reducer,
  },
});
