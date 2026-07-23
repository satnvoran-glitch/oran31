package com.viucinema.tv.data.api

import com.viucinema.tv.config.AppConfig
import com.viucinema.tv.data.model.CategoriesResponse
import com.viucinema.tv.data.model.ContentProxyResponse
import com.viucinema.tv.data.model.LoginRequest
import com.viucinema.tv.data.model.LoginResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.Query

interface ViuApiService {

    // 1. Activation & Re-login with 8-digit subscription code
    @POST(AppConfig.ENDPOINT_LOGIN)
    suspend fun login(
        @Body request: LoginRequest
    ): Response<LoginResponse>

    // 2. Fetch filtered categories (removes hidden=true & applies sort_order)
    @GET(AppConfig.ENDPOINT_CATEGORIES)
    suspend fun getCategories(
        @Header("Authorization") bearerToken: String,
        @Query("server_id") serverId: String? = null
    ): Response<CategoriesResponse>

    // 3. Fetch Real-time Proxy Content (Movies, Series, Shahid VIP, My Movies)
    @GET(AppConfig.ENDPOINT_CONTENT)
    suspend fun getContentProxy(
        @Header("Authorization") bearerToken: String,
        @Path("type") type: String,
        @Query("action") action: String? = null,
        @Query("category_id") categoryId: String? = null
    ): Response<ContentProxyResponse>
}
