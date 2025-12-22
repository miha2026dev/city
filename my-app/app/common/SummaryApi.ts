"use client";
export const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const SummaryApi = {
  user: {
    craete:{
      method:"POST",
      url:`${baseURL}/api/users/create`
    },
    register: {
      method: "POST",
      url: `${baseURL}/api/users/register`,
    },

    login: {
      method: "POST",
      url: `${baseURL}/api/users/login`,
    },
  

    refreshToken: {
      method: "POST",
      url: `${baseURL}/api/users/refresh-token`,
    },

    // get user by ID
    getUserById: (id: number | string) => ({
      method: "GET",
      url: `${baseURL}/api/users/getUser/${id}`,
    }),

    // update user
    updateUser: (id: number | string) => ({
      method: "PATCH",
      url: `${baseURL}/api/users/update/${id}`,
    }),

    // delete user (ADMIN only)
    deleteUser: (id: number | string) => ({
      method: "DELETE",
      url: `${baseURL}/api/users/delete/${id}`,
    }),
    get_all_users:{
      method:"GET",
      url:`${baseURL}/api/users/get-all`
    },
    get_active:{
      method:"GET",
      url:`${baseURL}/api/users/active`
    }
  },
  owner:{
     create_bus: {
      method: "POST",
      url: `${baseURL}/api/bus/createbusinesses`,
    },
     get_bus: {
      method: "GET",
      url: `${baseURL}/api/bus/getbusinesses`,
    },
     get_bus_by_id: (id: number | string) => ({
      method: "GET",
      url: `${baseURL}/api/bus/getbusinesse/${id}` 
    }),
      updateBus: (id: number | string) => ({
      method: "PUT",
      url: `${baseURL}/api/bus/updatebusinesses/${id}` 
    }),
     deleteBus: (id: number | string) => ({
      method: "DELETE",
      url: `${baseURL}/api/bus/deletebusinesses/${id}`   
    }),
     getbusinessesState: (id: number | string) => ({
      method: "GET",
      url: `${baseURL}/api/bus/getbusinessesState/${id}/stats`,
    }),
     create_event: {
      method: "POST",
      url: `${baseURL}/api/events/create-events`,
    },
     get_bus_event: (id: number | string) => ({
      method: "GET",
      url: `${baseURL}/api/events/get-businesses/${id}/events`,
    }),
    check_user_business:{
      method: "GET",
      url: `${baseURL}/api/bus/checkUserBusiness`,
    }

  },
  category:{
     create_category: {
      method: "POST",
      url: `${baseURL}/api/categories/createcategory`,
    },
      get_categories: {
      method: "GET",
      url: `${baseURL}/api/categories/getcategories`,
    },
      get_category: (id: number | string) => ({
      method: "GET",
      url: `${baseURL}/api/categories/getcategory/${id}`,
      }),
     updateCategory: (id: number | string) => ({
      method: "PUT",
     url: `${baseURL}/api/categories/updatecategory/${id}`
    }),
     deleteCategory: (id: number | string) => ({
      method: "DELETE",
      url: `${baseURL}/api/categories/deleteCategory/${id}`,
    }),
  },
  ad:{
     get_public_ads: {
    method: "GET",
    url: `${baseURL}/api/ads/get-public`,
  },

  get_ads_by_type: (type: string) => ({
    method: "GET",
    url: `${baseURL}/api/ads/get-adstype/${type}`,
  }),

  increment_clicks: (id: number | string) => ({
    method: "POST",
    url: `${baseURL}/api/ads/incremant/${id}/click`,
  }),

  // ============ AUTHENTICATED ADS ============
  create_ad: {
    method: "POST",
    url: `${baseURL}/api/ads/create-add`,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  },

  get_all_ads: {
    method: "GET",
    url: `${baseURL}/api/ads/get-all`,
  },

  get_my_ads: {
    method: "GET",
    url: `${baseURL}/api/ads/get-my`,
  },

  get_ad_by_id: (id: number | string) => ({
    method: "GET",
    url: `${baseURL}/api/ads/get-add/${id}`,
  }),

  update_ad_status: (id: number | string) => ({
    method: "PUT",
    url: `${baseURL}/api/ads/update-states/${id}/status`,
  }),

  update_ad: (id: number | string) => ({
    method: "PUT",
    url: `${baseURL}/api/ads/update-ad/${id}`,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }),

  delete_ad: (id: number | string) => ({
    method: "DELETE",
    url: `${baseURL}/api/ads/delete-add/${id}`,
  }),
  }
};

export default SummaryApi;
