package com.viucinema.tv.ui.main

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.viucinema.tv.config.AppConfig
import com.viucinema.tv.data.model.CategoryItem
import com.viucinema.tv.data.model.MediaItem
import com.viucinema.tv.data.repository.MediaRepository
import kotlinx.coroutines.launch

class MainViewModel(private val mediaRepository: MediaRepository) : ViewModel() {

    private val _currentType = MutableLiveData<String>(AppConfig.TYPE_MOVIES)
    val currentType: LiveData<String> = _currentType

    private val _categories = MutableLiveData<List<CategoryItem>>(emptyList())
    val categories: LiveData<List<CategoryItem>> = _categories

    private val _selectedCategoryId = MutableLiveData<String?>(null)

    private val _mediaList = MutableLiveData<List<MediaItem>>(emptyList())
    val mediaList: LiveData<List<MediaItem>> = _mediaList

    private val _isLoading = MutableLiveData<Boolean>(false)
    val isLoading: LiveData<Boolean> = _isLoading

    private val _errorMessage = MutableLiveData<String?>(null)
    val errorMessage: LiveData<String?> = _errorMessage

    fun selectSection(type: String) {
        _currentType.value = type
        _selectedCategoryId.value = null
        loadCategoriesAndContent(type)
    }

    fun selectCategory(categoryId: String?) {
        _selectedCategoryId.value = categoryId
        val type = _currentType.value ?: AppConfig.TYPE_MOVIES
        loadContent(type, categoryId)
    }

    private fun loadCategoriesAndContent(type: String) {
        _isLoading.value = true
        _errorMessage.value = null
        viewModelScope.launch {
            if (type != AppConfig.TYPE_MY_MOVIES) {
                val catResult = mediaRepository.fetchCategories(type)
                catResult.onSuccess { list ->
                    _categories.value = list
                }
            } else {
                _categories.value = emptyList()
            }

            loadContent(type, null)
        }
    }

    private fun loadContent(type: String, categoryId: String?) {
        _isLoading.value = true
        _errorMessage.value = null
        viewModelScope.launch {
            val contentResult = mediaRepository.fetchContent(type, categoryId)
            _isLoading.value = false
            contentResult.fold(
                onSuccess = { items ->
                    _mediaList.value = items
                },
                onFailure = { error ->
                    _errorMessage.value = error.localizedMessage ?: "Erreur de chargement."
                }
            )
        }
    }
}
