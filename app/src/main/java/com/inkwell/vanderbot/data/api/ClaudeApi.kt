package com.inkwell.vanderbot.data.api

import android.util.Base64
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.inkwell.vanderbot.BuildConfig
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import okhttp3.sse.EventSource
import okhttp3.sse.EventSourceListener
import okhttp3.sse.EventSources
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

data class ChatMessage(
    val role: String,
    val content: Any  // String or List<ContentBlock>
)

data class ContentBlock(
    val type: String,
    val text: String? = null,
    val source: ImageSource? = null
)

data class ImageSource(
    val type: String = "base64",
    val media_type: String,
    val data: String
)

sealed class StreamEvent {
    data class Delta(val text: String) : StreamEvent()
    data class Error(val message: String) : StreamEvent()
    object Done : StreamEvent()
}

@Singleton
class ClaudeApi @Inject constructor(
    private val client: OkHttpClient,
    private val gson: Gson
) {
    companion object {
        private const val BASE_URL = "https://api.anthropic.com/v1"
        private const val MODEL = "claude-sonnet-4-20250514"
        private const val MAX_TOKENS = 4096
    }

    /**
     * Stream a chat completion. Returns a Flow of text deltas.
     */
    fun streamChat(
        messages: List<ChatMessage>,
        systemPrompt: String = "You are VanderBot, Oliver Luckett's AI assistant. Be direct, sharp, and helpful. You can create documents, pitch decks, and web pages when asked."
    ): Flow<StreamEvent> = callbackFlow {
        val body = buildJsonBody(messages, systemPrompt, stream = true)

        val request = Request.Builder()
            .url("$BASE_URL/messages")
            .header("x-api-key", BuildConfig.CLAUDE_API_KEY)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .post(body.toRequestBody("application/json".toMediaType()))
            .build()

        val factory = EventSources.createFactory(client)
        val listener = object : EventSourceListener() {
            override fun onEvent(es: EventSource, id: String?, type: String?, data: String) {
                try {
                    when (type) {
                        "content_block_delta" -> {
                            val json = JsonParser.parseString(data).asJsonObject
                            val delta = json.getAsJsonObject("delta")
                            if (delta.has("text")) {
                                trySend(StreamEvent.Delta(delta.get("text").asString))
                            }
                        }
                        "message_stop" -> {
                            trySend(StreamEvent.Done)
                        }
                        "error" -> {
                            val json = JsonParser.parseString(data).asJsonObject
                            trySend(StreamEvent.Error(json.toString()))
                        }
                    }
                } catch (e: Exception) {
                    trySend(StreamEvent.Error(e.message ?: "Parse error"))
                }
            }

            override fun onFailure(es: EventSource, t: Throwable?, response: Response?) {
                trySend(StreamEvent.Error(t?.message ?: "Connection failed (${response?.code})"))
                close()
            }

            override fun onClosed(es: EventSource) {
                close()
            }
        }

        val eventSource = factory.newEventSource(request, listener)
        awaitClose { eventSource.cancel() }
    }

    /**
     * Non-streaming chat for document generation.
     */
    suspend fun chat(
        messages: List<ChatMessage>,
        systemPrompt: String = "You are VanderBot. Generate exactly what is asked — documents, HTML, slide content. Output the content directly, no commentary."
    ): String {
        val body = buildJsonBody(messages, systemPrompt, stream = false)

        val request = Request.Builder()
            .url("$BASE_URL/messages")
            .header("x-api-key", BuildConfig.CLAUDE_API_KEY)
            .header("anthropic-version", "2023-06-01")
            .header("content-type", "application/json")
            .post(body.toRequestBody("application/json".toMediaType()))
            .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) throw IOException("API error: ${response.code}")

        val json = JsonParser.parseString(response.body?.string()).asJsonObject
        return json.getAsJsonArray("content")
            .first().asJsonObject
            .get("text").asString
    }

    /**
     * Build message with image attachment.
     */
    fun buildImageMessage(text: String, imageBytes: ByteArray, mimeType: String): ChatMessage {
        val b64 = Base64.encodeToString(imageBytes, Base64.NO_WRAP)
        return ChatMessage(
            role = "user",
            content = listOf(
                ContentBlock(type = "image", source = ImageSource(media_type = mimeType, data = b64)),
                ContentBlock(type = "text", text = text)
            )
        )
    }

    private fun buildJsonBody(messages: List<ChatMessage>, system: String, stream: Boolean): String {
        val obj = JsonObject().apply {
            addProperty("model", MODEL)
            addProperty("max_tokens", MAX_TOKENS)
            addProperty("system", system)
            addProperty("stream", stream)
            add("messages", gson.toJsonTree(messages))
        }
        return obj.toString()
    }
}
