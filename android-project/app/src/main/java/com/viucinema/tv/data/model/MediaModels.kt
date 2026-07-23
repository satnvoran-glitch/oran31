package com.viucinema.tv.data.model

import com.google.gson.annotations.SerializedName

data class CategoryItem(
    @SerializedName("id")
    val id: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("order")
    val order: Int = 0,

    @SerializedName("server_id")
    val serverId: String = "movies",

    @SerializedName("hidden")
    val hidden: Boolean = false
)

data class CategoriesResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("total")
    val total: Int,

    @SerializedName("categories")
    val categories: List<CategoryItem>
)

data class MediaItem(
    @SerializedName("stream_id")
    val streamId: Any?,

    @SerializedName("series_id")
    val seriesId: Any?,

    @SerializedName("name")
    val name: String?,

    @SerializedName("title")
    val title: String?,

    @SerializedName("category_id")
    val categoryId: String?,

    @SerializedName("category_name")
    val categoryName: String?,

    @SerializedName("cover")
    val cover: String?,

    @SerializedName("stream_icon")
    val streamIcon: String?,

    @SerializedName("rating")
    val rating: String?,

    @SerializedName("container_extension")
    val containerExtension: String? = "mp4",

    @SerializedName("releaseDate")
    val releaseDate: String?
) {
    fun getId(): String {
        return (streamId ?: seriesId ?: "0").toString()
    }

    fun getDisplayName(): String {
        return name ?: title ?: "Titre Inconnu"
    }

    fun getImageUrl(): String {
        return cover ?: streamIcon ?: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500&auto=format&fit=crop&q=60"
    }
}

data class ContentProxyResponse(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("server")
    val server: String?,

    @SerializedName("action")
    val action: String?,

    @SerializedName("count")
    val count: Int?,

    @SerializedName("data")
    val data: List<MediaItem>?,

    @SerializedName("error")
    val error: String?
)
