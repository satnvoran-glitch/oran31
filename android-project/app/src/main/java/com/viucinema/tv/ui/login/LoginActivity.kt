package com.viucinema.tv.ui.login

import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.viucinema.tv.R
import com.viucinema.tv.data.api.ViuApiClient
import com.viucinema.tv.data.repository.AuthRepository
import com.viucinema.tv.ui.main.MainActivity
import com.viucinema.tv.utils.SessionManager

class LoginActivity : AppCompatActivity() {

    private lateinit var etCode: EditText
    private lateinit var btnActivate: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var tvError: TextView

    private lateinit var sessionManager: SessionManager
    private lateinit var viewModel: LoginViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        sessionManager = SessionManager(this)

        // Check if session is already active -> navigate directly to MainActivity
        if (sessionManager.isLoggedIn()) {
            startActivity(Intent(this, MainActivity::class.java))
            finish()
            return
        }

        setContentView(R.layout.activity_login)

        etCode = findViewById(R.id.etCode)
        btnActivate = findViewById(R.id.btnActivate)
        progressBar = findViewById(R.id.progressBar)
        tvError = findViewById(R.id.tvError)

        val apiService = ViuApiClient.getApiService()
        val authRepository = AuthRepository(apiService, sessionManager)
        viewModel = LoginViewModel(authRepository)

        val deviceId = Settings.Secure.getString(contentResolver, Settings.Secure.ANDROID_ID) ?: "AndroidTV_Box"

        btnActivate.setOnClickListener {
            val code = etCode.text.toString().trim()
            viewModel.activateCode(code, deviceId)
        }

        observeViewModel()
    }

    private fun observeViewModel() {
        viewModel.loginState.observe(this) { state ->
            when (state) {
                is LoginState.Loading -> {
                    progressBar.visibility = View.VISIBLE
                    tvError.visibility = View.GONE
                    btnActivate.isEnabled = false
                }
                is LoginState.Success -> {
                    progressBar.visibility = View.GONE
                    btnActivate.isEnabled = true
                    Toast.makeText(this, "Bienvenue ${state.response.clientName ?: "Client"}!", Toast.LENGTH_SHORT).show()
                    startActivity(Intent(this, MainActivity::class.java))
                    finish()
                }
                is LoginState.Error -> {
                    progressBar.visibility = View.GONE
                    btnActivate.isEnabled = true
                    tvError.text = state.message
                    tvError.visibility = View.VISIBLE
                }
                is LoginState.Idle -> {
                    progressBar.visibility = View.GONE
                    tvError.visibility = View.GONE
                    btnActivate.isEnabled = true
                }
            }
        }
    }
}
