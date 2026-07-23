package com.viucinema.tv.ui.login

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.viucinema.tv.data.model.LoginResponse
import com.viucinema.tv.data.repository.AuthRepository
import kotlinx.coroutines.launch

sealed class LoginState {
    object Idle : LoginState()
    object Loading : LoginState()
    data class Success(val response: LoginResponse) : LoginState()
    data class Error(val message: String) : LoginState()
}

class LoginViewModel(private val authRepository: AuthRepository) : ViewModel() {

    private val _loginState = MutableLiveData<LoginState>(LoginState.Idle)
    val loginState: LiveData<LoginState> = _loginState

    fun activateCode(code: String, deviceId: String) {
        val cleanCode = code.trim().replace("\\D".toRegex(), "")
        if (cleanCode.length != 8) {
            _loginState.value = LoginState.Error("Veuillez saisir un code à 8 chiffres valide.")
            return
        }

        _loginState.value = LoginState.Loading
        viewModelScope.launch {
            val result = authRepository.authenticate(cleanCode, deviceId)
            result.fold(
                onSuccess = { response ->
                    _loginState.value = LoginState.Success(response)
                },
                onFailure = { error ->
                    _loginState.value = LoginState.Error(error.localizedMessage ?: "Échec de connexion.")
                }
            )
        }
    }
}
