package com.viucinema.tv.utils

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("viu_session", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_IS_LOGGED_IN = "is_logged_in"
        private const val KEY_JWT_TOKEN = "jwt_token"
        private const val KEY_CODE = "subscription_code"
        private const val KEY_USERNAME = "username"
        private const val KEY_CLIENT_NAME = "client_name"
        private const val KEY_EXPIRES_AT = "expires_at"
        private const val KEY_FAVORITES = "user_favorites"
    }

    fun saveSession(token: String, code: String, username: String, clientName: String?, expiresAt: String?) {
        prefs.edit().apply {
            putBoolean(KEY_IS_LOGGED_IN, true)
            putString(KEY_JWT_TOKEN, token)
            putString(KEY_CODE, code)
            putString(KEY_USERNAME, username)
            putString(KEY_CLIENT_NAME, clientName ?: "Client TV")
            putString(KEY_EXPIRES_AT, expiresAt ?: "")
            apply()
        }
    }

    fun isLoggedIn(): Boolean = prefs.getBoolean(KEY_IS_LOGGED_IN, false)

    fun getToken(): String? = prefs.getString(KEY_JWT_TOKEN, null)

    fun getCode(): String? = prefs.getString(KEY_CODE, "")

    fun getUsername(): String? = prefs.getString(KEY_USERNAME, "")

    fun getClientName(): String? = prefs.getString(KEY_CLIENT_NAME, "Client TV")

    fun getExpiresAt(): String? = prefs.getString(KEY_EXPIRES_AT, "")

    fun logout() {
        prefs.edit().clear().apply()
    }

    // Local Favorites management for "My Movies"
    fun getFavorites(): Set<String> {
        return prefs.getStringSet(KEY_FAVORITES, emptySet()) ?: emptySet()
    }

    fun toggleFavorite(streamId: String): Boolean {
        val current = getFavorites().toMutableSet()
        val isAdded: Boolean
        if (current.contains(streamId)) {
            current.remove(streamId)
            isAdded = false
        } else {
            current.add(streamId)
            isAdded = true
        }
        prefs.edit().putStringSet(KEY_FAVORITES, current).apply()
        return isAdded
    }

    fun isFavorite(streamId: String): Boolean {
        return getFavorites().contains(streamId)
    }
}
