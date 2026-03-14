package com.inkwell.vanderbot.data.api

import android.util.Base64
import com.google.gson.JsonObject
import com.google.gson.JsonParser
import com.inkwell.vanderbot.BuildConfig
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GitHubApi @Inject constructor(
    private val client: OkHttpClient
) {
    companion object {
        private const val API_BASE = "https://api.github.com"
    }

    private val repo get() = BuildConfig.GITHUB_REPO

    /**
     * Publish an HTML file to GitHub Pages (ontological-theatre repo).
     * Creates or updates the file, returns the Pages URL.
     */
    suspend fun publishPage(filename: String, htmlContent: String): String {
        val path = filename.removeSuffix(".html") + ".html"
        val encodedContent = Base64.encodeToString(htmlContent.toByteArray(), Base64.NO_WRAP)

        // Check if file exists (get SHA for update)
        val existingSha = getFileSha(path)

        val body = JsonObject().apply {
            addProperty("message", "Publish $path from VanderBot")
            addProperty("content", encodedContent)
            addProperty("branch", "main")
            existingSha?.let { addProperty("sha", it) }
        }

        val request = Request.Builder()
            .url("$API_BASE/repos/$repo/contents/$path")
            .header("Authorization", "Bearer ${BuildConfig.GITHUB_TOKEN}")
            .header("Accept", "application/vnd.github+json")
            .put(body.toString().toRequestBody("application/json".toMediaType()))
            .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) throw IOException("GitHub publish failed: ${response.code} ${response.body?.string()}")

        // Return Pages URL
        val (owner, repoName) = repo.split("/")
        return "https://$owner.github.io/$repoName/$path"
    }

    private fun getFileSha(path: String): String? {
        val request = Request.Builder()
            .url("$API_BASE/repos/$repo/contents/$path")
            .header("Authorization", "Bearer ${BuildConfig.GITHUB_TOKEN}")
            .header("Accept", "application/vnd.github+json")
            .get()
            .build()

        return try {
            val response = client.newCall(request).execute()
            if (response.isSuccessful) {
                JsonParser.parseString(response.body?.string()).asJsonObject.get("sha").asString
            } else null
        } catch (_: Exception) { null }
    }
}
