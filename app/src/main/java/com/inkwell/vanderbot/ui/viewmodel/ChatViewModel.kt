package com.inkwell.vanderbot.ui.viewmodel

import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.inkwell.vanderbot.data.api.ChatMessage
import com.inkwell.vanderbot.data.api.ClaudeApi
import com.inkwell.vanderbot.data.api.StreamEvent
import com.inkwell.vanderbot.data.db.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.UUID
import javax.inject.Inject

data class UiMessage(
    val id: String,
    val role: String,
    val content: String,
    val imageUri: String? = null,
    val isStreaming: Boolean = false
)

data class ChatUiState(
    val conversations: List<ConversationEntity> = emptyList(),
    val currentConversationId: String? = null,
    val messages: List<UiMessage> = emptyList(),
    val isStreaming: Boolean = false,
    val error: String? = null
)

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val claudeApi: ClaudeApi,
    private val conversationDao: ConversationDao,
    private val messageDao: MessageDao
) : ViewModel() {

    private val _state = MutableStateFlow(ChatUiState())
    val state: StateFlow<ChatUiState> = _state.asStateFlow()

    init {
        loadConversations()
    }

    fun loadConversations() {
        viewModelScope.launch {
            val convos = conversationDao.getAll()
            _state.update { it.copy(conversations = convos) }
        }
    }

    fun newConversation() {
        val id = UUID.randomUUID().toString()
        viewModelScope.launch {
            conversationDao.upsert(ConversationEntity(id = id, title = "New Chat"))
            _state.update { it.copy(currentConversationId = id, messages = emptyList()) }
            loadConversations()
        }
    }

    fun selectConversation(id: String) {
        viewModelScope.launch {
            val msgs = messageDao.getByConversation(id).map {
                UiMessage(id = it.id, role = it.role, content = it.content, imageUri = it.imageUri)
            }
            _state.update { it.copy(currentConversationId = id, messages = msgs) }
        }
    }

    fun sendMessage(text: String, imageUri: Uri? = null, imageBytes: ByteArray? = null, imageMimeType: String? = null) {
        val convId = _state.value.currentConversationId ?: run {
            newConversation()
            _state.value.currentConversationId!!
        }

        viewModelScope.launch {
            // Add user message
            val userMsg = UiMessage(
                id = UUID.randomUUID().toString(),
                role = "user",
                content = text,
                imageUri = imageUri?.toString()
            )
            _state.update { it.copy(messages = it.messages + userMsg, isStreaming = true, error = null) }

            // Persist user message
            messageDao.insert(MessageEntity(
                id = userMsg.id,
                conversationId = convId,
                role = "user",
                content = text,
                imageUri = imageUri?.toString()
            ))

            // Update conversation title from first message
            if (_state.value.messages.size == 1) {
                val title = text.take(50) + if (text.length > 50) "…" else ""
                conversationDao.upsert(ConversationEntity(id = convId, title = title))
                loadConversations()
            }

            // Build API messages
            val apiMessages = _state.value.messages.map { msg ->
                if (msg.role == "user" && imageBytes != null && msg.id == userMsg.id) {
                    claudeApi.buildImageMessage(msg.content, imageBytes, imageMimeType ?: "image/jpeg")
                } else {
                    ChatMessage(role = msg.role, content = msg.content)
                }
            }

            // Create streaming assistant message
            val assistantId = UUID.randomUUID().toString()
            val assistantMsg = UiMessage(id = assistantId, role = "assistant", content = "", isStreaming = true)
            _state.update { it.copy(messages = it.messages + assistantMsg) }

            // Stream response
            val fullResponse = StringBuilder()
            claudeApi.streamChat(apiMessages).collect { event ->
                when (event) {
                    is StreamEvent.Delta -> {
                        fullResponse.append(event.text)
                        _state.update { state ->
                            state.copy(messages = state.messages.map { msg ->
                                if (msg.id == assistantId) msg.copy(content = fullResponse.toString())
                                else msg
                            })
                        }
                    }
                    is StreamEvent.Done -> {
                        _state.update { state ->
                            state.copy(
                                isStreaming = false,
                                messages = state.messages.map { msg ->
                                    if (msg.id == assistantId) msg.copy(isStreaming = false)
                                    else msg
                                }
                            )
                        }
                        // Persist assistant message
                        messageDao.insert(MessageEntity(
                            id = assistantId,
                            conversationId = convId,
                            role = "assistant",
                            content = fullResponse.toString()
                        ))
                        // Update conversation timestamp
                        conversationDao.upsert(
                            conversationDao.getById(convId)!!.copy(updatedAt = System.currentTimeMillis())
                        )
                    }
                    is StreamEvent.Error -> {
                        _state.update { it.copy(isStreaming = false, error = event.message) }
                    }
                }
            }
        }
    }

    fun deleteConversation(id: String) {
        viewModelScope.launch {
            conversationDao.delete(id)
            messageDao.deleteByConversation(id)
            if (_state.value.currentConversationId == id) {
                _state.update { it.copy(currentConversationId = null, messages = emptyList()) }
            }
            loadConversations()
        }
    }

    fun clearError() {
        _state.update { it.copy(error = null) }
    }
}
