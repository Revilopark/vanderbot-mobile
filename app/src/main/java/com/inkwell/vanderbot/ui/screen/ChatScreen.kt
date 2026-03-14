package com.inkwell.vanderbot.ui.screen

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import com.inkwell.vanderbot.ui.theme.*
import com.inkwell.vanderbot.ui.viewmodel.UiMessage
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    messages: List<UiMessage>,
    isStreaming: Boolean,
    error: String?,
    onSend: (String, Uri?, ByteArray?, String?) -> Unit,
    onBack: () -> Unit,
    onClearError: () -> Unit
) {
    val context = LocalContext.current
    var inputText by remember { mutableStateOf("") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    // Image picker
    val imagePicker = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri -> selectedImageUri = uri }

    // Auto-scroll on new messages
    LaunchedEffect(messages.size, messages.lastOrNull()?.content) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(InkDark)
    ) {
        // Top bar
        TopAppBar(
            title = { Text("Chat", color = InkText, fontWeight = FontWeight.SemiBold) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(Icons.Filled.ArrowBack, contentDescription = "Back", tint = InkText)
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(containerColor = InkSurface)
        )

        // Error banner
        AnimatedVisibility(visible = error != null) {
            Surface(
                color = InkRed.copy(alpha = 0.15f),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(error ?: "", color = InkRed, fontSize = 13.sp, modifier = Modifier.weight(1f))
                    IconButton(onClick = onClearError) {
                        Icon(Icons.Filled.Close, contentDescription = "Dismiss", tint = InkRed, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }

        // Messages
        LazyColumn(
            state = listState,
            modifier = Modifier.weight(1f),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            if (messages.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier.fillParentMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("🐘", fontSize = 48.sp)
                            Spacer(Modifier.height(12.dp))
                            Text("What are we building?", color = InkTextDim, fontSize = 16.sp)
                        }
                    }
                }
            }

            items(messages, key = { it.id }) { message ->
                MessageBubble(message)
            }

            // Streaming indicator
            if (isStreaming && (messages.isEmpty() || !messages.last().isStreaming)) {
                item {
                    Row(modifier = Modifier.padding(start = 4.dp)) {
                        Text("●●●", color = InkGreen, fontSize = 16.sp)
                    }
                }
            }
        }

        // Image preview
        AnimatedVisibility(visible = selectedImageUri != null) {
            Surface(
                color = InkCard,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    AsyncImage(
                        model = selectedImageUri,
                        contentDescription = "Selected image",
                        modifier = Modifier
                            .size(60.dp)
                            .clip(RoundedCornerShape(8.dp)),
                        contentScale = ContentScale.Crop
                    )
                    Spacer(Modifier.weight(1f))
                    IconButton(onClick = { selectedImageUri = null }) {
                        Icon(Icons.Filled.Close, contentDescription = "Remove", tint = InkTextDim)
                    }
                }
            }
        }

        // Input bar
        Surface(
            color = InkSurface,
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .padding(horizontal = 12.dp, vertical = 8.dp)
                    .navigationBarsPadding()
                    .imePadding(),
                verticalAlignment = Alignment.Bottom
            ) {
                // Attach image
                IconButton(
                    onClick = { imagePicker.launch("image/*") },
                    modifier = Modifier.size(44.dp)
                ) {
                    Icon(Icons.Filled.Image, contentDescription = "Attach image", tint = InkTextDim)
                }

                // Text input
                OutlinedTextField(
                    value = inputText,
                    onValueChange = { inputText = it },
                    modifier = Modifier.weight(1f),
                    placeholder = { Text("Message VanderBot…", color = InkTextDim) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = InkGreen,
                        unfocusedBorderColor = InkBorder,
                        cursorColor = InkGreen,
                        focusedTextColor = InkText,
                        unfocusedTextColor = InkText
                    ),
                    shape = RoundedCornerShape(24.dp),
                    maxLines = 5,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(onSend = {
                        if (inputText.isNotBlank()) {
                            val imageBytes = selectedImageUri?.let { uri ->
                                context.contentResolver.openInputStream(uri)?.readBytes()
                            }
                            val mimeType = selectedImageUri?.let { uri ->
                                context.contentResolver.getType(uri)
                            }
                            onSend(inputText, selectedImageUri, imageBytes, mimeType)
                            inputText = ""
                            selectedImageUri = null
                        }
                    })
                )

                Spacer(Modifier.width(8.dp))

                // Send button
                FilledIconButton(
                    onClick = {
                        if (inputText.isNotBlank()) {
                            val imageBytes = selectedImageUri?.let { uri ->
                                context.contentResolver.openInputStream(uri)?.readBytes()
                            }
                            val mimeType = selectedImageUri?.let { uri ->
                                context.contentResolver.getType(uri)
                            }
                            onSend(inputText, selectedImageUri, imageBytes, mimeType)
                            inputText = ""
                            selectedImageUri = null
                        }
                    },
                    modifier = Modifier.size(44.dp),
                    shape = CircleShape,
                    enabled = inputText.isNotBlank() && !isStreaming,
                    colors = IconButtonDefaults.filledIconButtonColors(
                        containerColor = InkGreen,
                        contentColor = InkDark
                    )
                ) {
                    Icon(Icons.Filled.Send, contentDescription = "Send", modifier = Modifier.size(20.dp))
                }
            }
        }
    }
}

@Composable
private fun MessageBubble(message: UiMessage) {
    val isUser = message.role == "user"

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isUser) Alignment.End else Alignment.Start
    ) {
        // Image attachment
        message.imageUri?.let { uri ->
            AsyncImage(
                model = Uri.parse(uri),
                contentDescription = "Attached image",
                modifier = Modifier
                    .widthIn(max = 240.dp)
                    .clip(RoundedCornerShape(14.dp))
                    .padding(bottom = 4.dp),
                contentScale = ContentScale.FillWidth
            )
        }

        Surface(
            color = if (isUser) InkGreen.copy(alpha = 0.15f) else InkCard,
            shape = RoundedCornerShape(
                topStart = 16.dp,
                topEnd = 16.dp,
                bottomStart = if (isUser) 16.dp else 4.dp,
                bottomEnd = if (isUser) 4.dp else 16.dp
            ),
            modifier = Modifier.widthIn(max = 320.dp)
        ) {
            Text(
                text = message.content.ifEmpty { if (message.isStreaming) "…" else "" },
                color = InkText,
                fontSize = 14.sp,
                lineHeight = 20.sp,
                modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)
            )
        }
    }
}
