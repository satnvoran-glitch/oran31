package com.viucinema.tv.data.repository

import com.viucinema.tv.data.api.ViuApiService
import com.viucinema.tv.data.model.LoginRequest
import com.viucinema.tv.data.model.LoginResponse
import com.viucinema.tv.utils.SessionManager

class AuthRepository(
    private val apiService: ViuApiService,
    private val sessionManager: SessionManager
) {
    suspend fun authenticate(code: String, deviceId: String = "AndroidTV_Box"): Result<LoginResponse> {
        return try {
            val response = apiService.login(LoginRequest(code = code, deviceId = deviceId))
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success && !body.token.isNullOrEmpty()) {
                    sessionManager.saveSession(
                        token = body.token,
                        code = body.code ?: code,
                        username = body.username ?: "viu_client",
                        clientName = body.clientName,
                        expiresAt = body.expiresAt
                    )
                    Result.success(body)
                } else {
                    Result.failure(Exception(body.error ?: "Code d'activation invalide."))
                }
            } else {
                Result.failure(Exception("Erreur serveur (${response.code()}): ${response.message()}"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
