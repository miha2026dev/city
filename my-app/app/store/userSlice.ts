import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Role = "user" | "admin" |"owner";

export interface User {
  id: number;
  username: string;
  name?: string | null;
  role: Role;
  phone?: string | null;
  createdAt?: string;
  updatedAt?: string;
  accessToken?:string
}

export interface UserState {
  user: User | null;
  loading: boolean;
  error: string | null;
}


const loadUserFromStorage=()=>{
  if(typeof window === 'undefined') return null
  try{
    const userStr=localStorage.getItem('user')
    if(userStr){
      return JSON.parse(userStr) 
    }
  }catch (error) {
    console.error('Error loading user from localStorage:', error);
  }
}
const initialState: UserState = {
  user: loadUserFromStorage(),
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // يعين كل شيء دفعة واحدة (بعد تسجيل الدخول)
    setCredentials: (
      state,
      action: PayloadAction<{
        user: Partial<User>;
      }>
    ) => {
      state.user = action.payload.user as User;
      state.error = null;
      localStorage.setItem('user',JSON.stringify(state.user))
    },

    // يعين فقط بيانات المستخدم (مثلاً بعد جلب /me)
    setUser: (state, action: PayloadAction<Partial<User> | null>) => {
      state.user = action.payload ? ({ ...(state.user ?? {}), ...action.payload } as User) : null;
    },
    // مسح كل بيانات الجلسة (logout)
    clearSession: (state) => {
      state.user = null;
      state.error = null;
    },

    // حالة التحميل/الخطأ العامة
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  setCredentials,
  setUser,
  clearSession,
  setLoading,
  setError,
} = userSlice.actions;

export default userSlice.reducer;
