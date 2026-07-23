package com.viucinema.tv.data.repository

import com.viucinema.tv.config.AppConfig
import com.viucinema.tv.data.api.ViuApiService
import com.viucinema.tv.data.model.CategoryItem
import com.viucinema.tv.data.model.MediaItem
import com.viucinema.tv.utils.SessionManager

class MediaRepository(
    private val apiService: ViuApiService,
    private val sessionManager: SessionManager
) {

    private fun getAuthHeader(): String {
        val token = sessionManager.getToken() ?: ""
        return if (token.startsWith("Bearer ")) token else "Bearer $token"
    }

    suspend fun fetchCategories(type: String): Result<List<CategoryItem>> {
        return try {
            val serverId = when (type) {
                AppConfig.TYPE_SERIES -> "series"
                AppConfig.TYPE_SHAHID -> "shahid"
                else -> "movies"
            }
            val response = apiService.getCategories(getAuthHeader(), serverId = serverId)
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                Result.success(body.categories)
            } else {
                Result.success(emptyList())
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun fetchContent(type: String, categoryId: String? = null): Result<List<MediaItem>> {
        return try {
            if (type == AppConfig.TYPE_MY_MOVIES) {
                // Fetch movies and filter by user local favorites
                val moviesResponse = apiService.getContentProxy(getAuthHeader(), type = AppConfig.TYPE_MOVIES)
                if (moviesResponse.isSuccessful && moviesResponse.body()?.data != null) {
                    val allMovies = moviesResponse.body()!!.data!!
                    val favoriteIds = sessionManager.getFavorites()
                    val myMovies = allMovies.filter { favoriteIds.contains(it.getId()) }
                    return Result.success(myMovies)
                }
            }

            val action = when (type) {
                AppConfig.TYPE_SERIES, AppConfig.TYPE_SHAHID -> "get_series"
                else -> "get_vod_streams"
            }

            val response = apiService.getContentProxy(
                bearerToken = getAuthHeader(),
                type = type,
                action = action,
                categoryId = categoryId
            )

            if (response.isSuccessful && response.body() != null) {
                val items = response.body()!!.data ?: emptyList()
                Result.success(items)
            } else {
                Result.failure(Exception("Erreur de chargement (${response.code()})"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
