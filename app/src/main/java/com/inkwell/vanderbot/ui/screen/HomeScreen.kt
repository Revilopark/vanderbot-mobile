package com.inkwell.vanderbot.ui.screen

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.inkwell.vanderbot.data.db.ConversationEntity
import com.inkwell.vanderbot.data.db.DocumentEntity
import com.inkwell.vanderbot.ui.theme.*
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    conversations: List<ConversationEntity>,
    documents: List<DocumentEntity>,
    onNewChat: () -> Unit,
    onSelectChat: (String) -> Unit,
    onNewDocument: (String) -> Unit,  // type: "doc" | "deck" | "page"
    onSelectDocument: (String) -> Unit,
    onNavigateToChat: () -> Unit,
    onNavigateToFiles: () -> Unit
) {
    val dateFormat = remember { SimpleDateFormat("MMM d, h:mm a", Locale.US) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(InkDark)
            .padding(horizontal = 20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(top = 24.dp, bottom = 100.dp)
    ) {
        // Header
        item {
            Column {
                Text(
                    "VanderBot",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = InkText
                )
                Text(
                    "Your AI workspace",
                    fontSize = 14.sp,
                    color = InkTextDim
                )
            }
        }

        // Quick Actions
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                QuickAction(
                    icon = Icons.Filled.Chat,
                    label = "New Chat",
                    color = InkGreen,
                    modifier = Modifier.weight(1f),
                    onClick = { onNewChat(); onNavigateToChat() }
                )
                QuickAction(
                    icon = Icons.Filled.Description,
                    label = "Document",
                    color = InkBlue,
                    modifier = Modifier.weight(1f),
                    onClick = { onNewDocument("doc") }
                )
                QuickAction(
                    icon = Icons.Filled.Slideshow,
                    label = "Deck",
                    color = InkPurple,
                    modifier = Modifier.weight(1f),
                    onClick = { onNewDocument("deck") }
                )
                QuickAction(
                    icon = Icons.Filled.Web,
                    label = "Page",
                    color = InkCyan,
                    modifier = Modifier.weight(1f),
                    onClick = { onNewDocument("page") }
                )
            }
        }

        // Recent Chats
        if (conversations.isNotEmpty()) {
            item {
                SectionHeader(title = "Recent Chats", onSeeAll = onNavigateToChat)
            }
            items(conversations.take(5)) { conv ->
                GlassCard(
                    onClick = { onSelectChat(conv.id); onNavigateToChat() }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Icon(
                            Icons.Filled.ChatBubbleOutline,
                            contentDescription = null,
                            tint = InkGreen,
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                conv.title,
                                color = InkText,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Text(
                                dateFormat.format(Date(conv.updatedAt)),
                                color = InkTextDim,
                                fontSize = 12.sp
                            )
                        }
                        Icon(
                            Icons.Filled.ChevronRight,
                            contentDescription = null,
                            tint = InkTextDim,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }

        // Recent Documents
        if (documents.isNotEmpty()) {
            item {
                SectionHeader(title = "Recent Files", onSeeAll = onNavigateToFiles)
            }
            items(documents.take(5)) { doc ->
                GlassCard(
                    onClick = { onSelectDocument(doc.id); onNavigateToFiles() }
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(16.dp)
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
                            modifier = Modifier.size(20.dp)
                        )
                        Spacer(Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                doc.title,
                                color = InkText,
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Medium,
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    doc.type.uppercase(),
                                    color = InkTextDim,
                                    fontSize = 11.sp
                                )
                                if (doc.published) {
                                    Text("● LIVE", color = InkGreen, fontSize = 11.sp)
                                }
                                Text(
                                    "v${doc.version}",
                                    color = InkTextDim,
                                    fontSize = 11.sp
                                )
                            }
                        }
                        Icon(
                            Icons.Filled.ChevronRight,
                            contentDescription = null,
                            tint = InkTextDim,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                }
            }
        }

        // Empty state
        if (conversations.isEmpty() && documents.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 48.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("🐘", fontSize = 48.sp)
                        Spacer(Modifier.height(16.dp))
                        Text("Start a conversation", color = InkText, fontSize = 16.sp)
                        Text("or create a document", color = InkTextDim, fontSize = 14.sp)
                    }
                }
            }
        }
    }
}

@Composable
private fun QuickAction(
    icon: ImageVector,
    label: String,
    color: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Surface(
        modifier = modifier
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onClick),
        color = color.copy(alpha = 0.08f),
        shape = RoundedCornerShape(14.dp),
        border = ButtonDefaults.outlinedButtonBorder
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(vertical = 16.dp, horizontal = 8.dp)
        ) {
            Icon(icon, contentDescription = label, tint = color, modifier = Modifier.size(24.dp))
            Spacer(Modifier.height(6.dp))
            Text(label, color = color, fontSize = 11.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun SectionHeader(title: String, onSeeAll: () -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, color = InkText, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        TextButton(onClick = onSeeAll) {
            Text("See all", color = InkGreen, fontSize = 13.sp)
        }
    }
}

@Composable
fun GlassCard(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onClick),
        color = InkCard.copy(alpha = 0.6f),
        shape = RoundedCornerShape(14.dp),
        border = ButtonDefaults.outlinedButtonBorder
    ) {
        content()
    }
}
