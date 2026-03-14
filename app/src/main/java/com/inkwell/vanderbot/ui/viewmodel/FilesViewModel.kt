package com.inkwell.vanderbot.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.inkwell.vanderbot.data.api.GitHubApi
import com.inkwell.vanderbot.data.db.DocumentDao
import com.inkwell.vanderbot.data.db.DocumentEntity
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class FilesUiState(
    val documents: List<DocumentEntity> = emptyList(),
    val selectedDoc: DocumentEntity? = null,
    val filter: String = "all",  // "all" | "doc" | "deck" | "page"
    val isPublishing: Boolean = false,
    val publishResult: String? = null,
    val error: String? = null
)

@HiltViewModel
class FilesViewModel @Inject constructor(
    private val documentDao: DocumentDao,
    private val gitHubApi: GitHubApi
) : ViewModel() {

    private val _state = MutableStateFlow(FilesUiState())
    val state: StateFlow<FilesUiState> = _state.asStateFlow()

    init {
        loadDocuments()
    }

    fun loadDocuments() {
        viewModelScope.launch {
            val docs = if (_state.value.filter == "all") {
                documentDao.getAll()
            } else {
                documentDao.getByType(_state.value.filter)
            }
            _state.update { it.copy(documents = docs) }
        }
    }

    fun setFilter(filter: String) {
        _state.update { it.copy(filter = filter) }
        loadDocuments()
    }

    fun createDocument(title: String, type: String, content: String): String {
        val id = UUID.randomUUID().toString()
        viewModelScope.launch {
            documentDao.upsert(DocumentEntity(id = id, title = title, type = type, content = content))
            loadDocuments()
        }
        return id
    }

    fun selectDocument(id: String) {
        viewModelScope.launch {
            val doc = documentDao.getById(id)
            _state.update { it.copy(selectedDoc = doc) }
        }
    }

    fun updateDocument(id: String, content: String, title: String? = null) {
        viewModelScope.launch {
            val existing = documentDao.getById(id) ?: return@launch
            documentDao.upsert(existing.copy(
                content = content,
                title = title ?: existing.title,
                version = existing.version + 1,
                updatedAt = System.currentTimeMillis()
            ))
            selectDocument(id)
            loadDocuments()
        }
    }

    fun publishToGitHub(id: String) {
        viewModelScope.launch {
            _state.update { it.copy(isPublishing = true, error = null) }
            try {
                val doc = documentDao.getById(id) ?: throw Exception("Document not found")
                val filename = doc.title.lowercase()
                    .replace(Regex("[^a-z0-9]+"), "-")
                    .trim('-')
                val url = gitHubApi.publishPage("$filename.html", doc.content)
                documentDao.upsert(doc.copy(published = true, publishUrl = url, updatedAt = System.currentTimeMillis()))
                _state.update { it.copy(isPublishing = false, publishResult = url) }
                selectDocument(id)
                loadDocuments()
            } catch (e: Exception) {
                _state.update { it.copy(isPublishing = false, error = e.message) }
            }
        }
    }

    fun deleteDocument(id: String) {
        viewModelScope.launch {
            documentDao.delete(id)
            if (_state.value.selectedDoc?.id == id) {
                _state.update { it.copy(selectedDoc = null) }
            }
            loadDocuments()
        }
    }

    fun clearPublishResult() {
        _state.update { it.copy(publishResult = null) }
    }
}
