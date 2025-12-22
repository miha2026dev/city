import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";
import userReducer from "./userSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
  devTools: process.env.NODE_ENV !== "production",
});

// أنواع مفيدة للـ TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// hooks جاهزة للاستخدام في الcomponents
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export default store;
