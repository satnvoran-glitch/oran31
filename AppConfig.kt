package com.viucinema.tv.config

object AppConfig {
    // Replace BASE_URL with your live server URL (e.g., Render, VPS, or Cloud Run instance)
    const val BASE_URL = "https://ais-dev-b5ujdytgmhdx7a4j7c222a-48389572533.europe-west2.run.app/"
    
    // API Endpoints
    const val ENDPOINT_LOGIN = "api/app/login"
    const val ENDPOINT_CATEGORIES = "api/app/categories"
    const val ENDPOINT_CONTENT = "api/app/content/{type}"

    // Tab Types
    const val TYPE_MOVIES = "movies"
    const val TYPE_SERIES = "series"
    const val TYPE_SHAHID = "shahid"
    const val TYPE_MY_MOVIES = "mymovies"
}
