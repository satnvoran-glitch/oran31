package com.viucinema.tv.ui.main

import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.GridLayoutManager
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.viucinema.tv.R
import com.viucinema.tv.config.AppConfig
import com.viucinema.tv.data.api.ViuApiClient
import com.viucinema.tv.data.repository.MediaRepository
import com.viucinema.tv.ui.login.LoginActivity
import com.viucinema.tv.ui.main.adapters.CategoryAdapter
import com.viucinema.tv.ui.main.adapters.MediaAdapter
import com.viucinema.tv.utils.SessionManager

class MainActivity : AppCompatActivity() {

    private lateinit var btnTabMovies: Button
    private lateinit var btnTabSeries: Button
    private lateinit var btnTabShahid: Button
    private lateinit var btnTabMyMovies: Button
    private lateinit var btnLogout: Button
    private lateinit var tvUserBadge: TextView

    private lateinit var rvCategories: RecyclerView
    private lateinit var rvMediaGrid: RecyclerView
    private lateinit var pbLoading: ProgressBar
    private lateinit var tvEmptyState: TextView

    private lateinit var sessionManager: SessionManager
    private lateinit var viewModel: MainViewModel

    private lateinit var mediaAdapter: MediaAdapter
    private lateinit var categoryAdapter: CategoryAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sessionManager = SessionManager(this)

        if (!sessionManager.isLoggedIn()) {
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_main)

        initViews()
        setupRecyclerViews()
        setupViewModel()
        setupListeners()

        // Select Movies tab by default on app launch
        selectTab(AppConfig.TYPE_MOVIES)
    }

    private fun initViews() {
        btnTabMovies = findViewById(R.id.btnTabMovies)
        btnTabSeries = findViewById(R.id.btnTabSeries)
        btnTabShahid = findViewById(R.id.btnTabShahid)
        btnTabMyMovies = findViewById(R.id.btnTabMyMovies)
        btnLogout = findViewById(R.id.btnLogout)
        tvUserBadge = findViewById(R.id.tvUserBadge)

        rvCategories = findViewById(R.id.rvCategories)
        rvMediaGrid = findViewById(R.id.rvMediaGrid)
        pbLoading = findViewById(R.id.pbLoading)
        tvEmptyState = findViewById(R.id.tvEmptyState)

        val username = sessionManager.getUsername() ?: "Client"
        tvUserBadge.text = "Abonné: $username"
    }

    private fun setupRecyclerViews() {
        categoryAdapter = CategoryAdapter { category ->
            viewModel.selectCategory(category?.id)
        }
        rvCategories.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        rvCategories.adapter = categoryAdapter

        mediaAdapter = MediaAdapter(
            onItemClick = { item ->
                Toast.makeText(this, "Lecture de: ${item.getDisplayName()}", Toast.LENGTH_SHORT).show()
            },
            onItemLongClick = { item ->
                val isAdded = sessionManager.toggleFavorite(item.getId())
                val msg = if (isAdded) "Ajouté à My Movies" else "Retiré de My Movies"
                Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()
            }
        )
        rvMediaGrid.layoutManager = GridLayoutManager(this, 5)
        rvMediaGrid.adapter = mediaAdapter
    }

    private fun setupViewModel() {
        val apiService = ViuApiClient.getApiService()
        val mediaRepository = MediaRepository(apiService, sessionManager)
        viewModel = MainViewModel(mediaRepository)

        viewModel.categories.observe(this) { categories ->
            if (categories.isEmpty()) {
                rvCategories.visibility = View.GONE
            } else {
                rvCategories.visibility = View.VISIBLE
                categoryAdapter.updateData(categories)
            }
        }

        viewModel.mediaList.observe(this) { items ->
            mediaAdapter.updateData(items)
            if (items.isEmpty() && viewModel.isLoading.value == false) {
                tvEmptyState.visibility = View.VISIBLE
            } else {
                tvEmptyState.visibility = View.GONE
            }
        }

        viewModel.isLoading.observe(this) { isLoading ->
            pbLoading.visibility = if (isLoading) View.VISIBLE else View.GONE
        }

        viewModel.errorMessage.observe(this) { msg ->
            if (!msg.isNullOrEmpty()) {
                Toast.makeText(this, msg, Toast.LENGTH_LONG).show()
            }
        }
    }

    private fun setupListeners() {
        btnTabMovies.setOnClickListener { selectTab(AppConfig.TYPE_MOVIES) }
        btnTabSeries.setOnClickListener { selectTab(AppConfig.TYPE_SERIES) }
        btnTabShahid.setOnClickListener { selectTab(AppConfig.TYPE_SHAHID) }
        btnTabMyMovies.setOnClickListener { selectTab(AppConfig.TYPE_MY_MOVIES) }

        btnLogout.setOnClickListener {
            sessionManager.logout()
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
        }
    }

    private fun selectTab(type: String) {
        btnTabMovies.setTextColor(if (type == AppConfig.TYPE_MOVIES) Color.WHITE else Color.GRAY)
        btnTabSeries.setTextColor(if (type == AppConfig.TYPE_SERIES) Color.WHITE else Color.GRAY)
        btnTabShahid.setTextColor(if (type == AppConfig.TYPE_SHAHID) Color.WHITE else Color.GRAY)
        btnTabMyMovies.setTextColor(if (type == AppConfig.TYPE_MY_MOVIES) Color.parseColor("#F59E0B") else Color.GRAY)

        viewModel.selectSection(type)
    }
}
