package com.inkwell.vanderbot.ui.screen

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inkwell.vanderbot.data.db.DocumentEntity
import com.inkwell.vanderbot.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilesScreen(
    documents: List<DocumentEntity>,
    selectedDoc: DocumentEntity?,
    filter: String,
    isPublishing: Boolean,
    publishResult: String?,
    onFilterChange: (String) -> Unit,
    onSelectDoc: (String) -> Unit,
    onDeleteDoc: (String) -> Unit,
    onPublish: (String) -> Unit,
    onClearPublishResult: () -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val dateFormat = remember { SimpleDateFormat("MMM d, h:mm a", Locale.US) }

    // Publish success dialog
    publishResult?.let { url ->
        AlertDialog(
            onDismissRequest = onClearPublishResult,
            title = { Text("Published! 🎉", color = InkText) },
            text = { Text(url, color = InkGreen, fontSize = 13.sp) },
            confirmButton = {
                TextButton(onClick = {
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                    onClearPublishResult()
                }) { Text("Open", color = InkGreen) }
            },
            dismissButton = {
                TextButton(onClick = onClearPublishResult) { Text("Close", color = InkTextDim) }
            },
            containerColor = InkCard
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(InkDark)
    ) {
        // Top bar
        TopAppBar(
            title = { Text("Files", color = InkText, fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = InkText)
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = InkSurface)
        )

        // Filter chips
        LazyRow(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val filters = listOf("all" to "All", "doc" to "Docs", "deck" to "Decks", "page" to "Pages")
            items(filters) { (key, label) ->
                FilterChip(
                    selected = filter == key,
                    onClick = { onFilterChange(key) },
                    label = { Text(label, fontSize = 13.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = InkGreen.copy(alpha = 0.15f),
                        selectedLabelColor = InkGreen,
                        containerColor = InkCard,
                        labelColor = InkTextDim
                    )
                )
            }
        }

        if (selectedDoc != null) {
            // Document detail view
            DocumentDetailView(
                doc = selectedDoc,
                isPublishing = isPublishing,
                onPublish = { onPublish(selectedDoc.id) },
                onDelete = { onDeleteDoc(selectedDoc.id) },
                onOpenUrl = { url ->
                    context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                },
                onBack = { onSelectDoc("") },
                dateFormat = dateFormat
            )
        } else {
            // Document list
            LazyColumn(
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (documents.isEmpty()) {
                    item {
                        Box(
                            modifier = Modifier
                                .fillParentMaxSize()
                                .padding(48.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("📁", fontSize = 48.sp)
                                Spacer(Modifier.height(12.dp))
                                Text("No files yet", color = InkTextDim, fontSize = 16.sp)
                                Text("Create a document from chat", color = InkTextDim, fontSize = 13.sp)
                            }
                        }
                    }
                }

                items(documents) { doc ->
                    GlassCard(onClick = { onSelectDoc(doc.id) }) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                when (doc.type) {
                                    "deck" -> Icons.Filled.Slideshow
                                    "page" -> Icons.Filled.Web
                                    else -> Icons.Filled.Description
                                },
                                contentDescription = null,
                                tint = when (doc.type) {
                                    "deck" -> InkPurple
                                    "page" -> InkCyan
                                    else -> InkBlue
                                },
                                modifier = Modifier.size(24.dp)
                            )
                            Spacer(Modifier.width(14.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    doc.title,
                                    color = InkText,
                                    fontWeight = FontWeight.Medium,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Text(doc.type.uppercase(), color = InkTextDim, fontSize = 11.sp)
                                    Text("v${doc.version}", color = InkTextDim, fontSize = 11.sp)
                                    if (doc.published) {
                                        Text("● LIVE", color = InkGreen, fontSize = 11.sp)
                                    }
                                    Text(dateFormat.format(Date(doc.updatedAt)), color = InkTextDim, fontSize = 11.sp)
                                }
                            }
                            Icon(Icons.Filled.ChevronRight, contentDescription = null, tint = InkTextDim, modifier = Modifier.size(18.dp))
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DocumentDetailView(
    doc: DocumentEntity,
    isPublishing: Boolean,
    onPublish: () -> Unit,
    onDelete: () -> Unit,
    onOpenUrl: (String) -> Unit,
    onBack: () -> Unit,
    dateFormat: SimpleDateFormat
) {
    var showDeleteConfirm by remember { mutableStateOf(false) }

    if (showDeleteConfirm) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirm = false },
            title = { Text("Delete?", color = InkText) },
            text = { Text("This will permanently delete \"${doc.title}\"", color = InkTextDim) },
            confirmButton = {
                TextButton(onClick = { onDelete(); showDeleteConfirm = false }) {
                    Text("Delete", color = InkRed)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirm = false }) {
                    Text("Cancel", color = InkTextDim)
                }
            },
            containerColor = InkCard
        )
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Back + title
        item {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = InkText)
                }
                Column(modifier = Modifier.weight(1f)) {
                    Text(doc.title, color = InkText, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text(
                        "${doc.type.uppercase()} · v${doc.version} · ${dateFormat.format(Date(doc.updatedAt))}",
                        color = InkTextDim,
                        fontSize = 12.sp
                    )
                }
            }
        }

        // Actions
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (doc.type == "page") {
                    Button(
                        onClick = onPublish,
                        enabled = !isPublishing,
                        colors = ButtonDefaults.buttonColors(containerColor = InkGreen, contentColor = InkDark),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        if (isPublishing) {
                            CircularProgressIndicator(modifier = Modifier.size(16.dp), color = InkDark, strokeWidth = 2.dp)
                            Spacer(Modifier.width(8.dp))
                        }
                        Icon(Icons.Filled.Publish, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text(if (doc.published) "Republish" else "Publish")
                    }
                }

                if (doc.publishUrl != null) {
                    OutlinedButton(
                        onClick = { onOpenUrl(doc.publishUrl!!) },
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Icon(Icons.Filled.OpenInBrowser, contentDescription = null, modifier = Modifier.size(18.dp), tint = InkCyan)
                        Spacer(Modifier.width(6.dp))
                        Text("View Live", color = InkCyan)
                    }
                }

                OutlinedButton(
                    onClick = { showDeleteConfirm = true },
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Icon(Icons.Filled.Delete, contentDescription = null, modifier = Modifier.size(18.dp), tint = InkRed)
                    Spacer(Modifier.width(6.dp))
                    Text("Delete", color = InkRed)
                }
            }
        }

        // Content preview
        item {
            Surface(
                color = InkCard,
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = doc.content.take(2000) + if (doc.content.length > 2000) "\n\n…" else "",
                    color = InkText.copy(alpha = 0.8f),
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    modifier = Modifier.padding(16.dp)
                )
            }
        }
    }
}
