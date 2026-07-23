package com.viucinema.tv.data.model

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    @SerializedName("code")
    val code: String,

    @SerializedName("device_id")
    val deviceId: String = "AndroidTV_Box",

    @SerializedName("device_name")
    val deviceName: String = "Android TV"
)

data class LoginResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("message")
    val message: String?,

    @SerializedName("status")
    val status: String?,

    @SerializedName("token")
    val token: String?,

    @SerializedName("code")
    val code: String?,

    @SerializedName("client_name")
    val clientName: String?,

    @SerializedName("username")
    val username: String?,

    @SerializedName("activated_at")
    val activatedAt: String?,

    @SerializedName("expires_at")
    val expiresAt: String?,

    @SerializedName("error")
    val error: String?
)
