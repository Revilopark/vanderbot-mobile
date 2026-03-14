package com.inkwell.vanderbot.ui

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.inkwell.vanderbot.ui.screen.*
import com.inkwell.vanderbot.ui.theme.VanderBotTheme
import com.inkwell.vanderbot.ui.viewmodel.ChatViewModel
import com.inkwell.vanderbot.ui.viewmodel.FilesViewModel
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            VanderBotTheme {
                VanderBotApp()
            }
        }
    }
}

@Composable
fun VanderBotApp() {
    val navController = rememberNavController()
    val chatVm: ChatViewModel = hiltViewModel()
    val filesVm: FilesViewModel = hiltViewModel()
    val chatState by chatVm.state.collectAsStateWithLifecycle()
    val filesState by filesVm.state.collectAsStateWithLifecycle()

    val currentRoute = navController.currentBackStackEntryAsState().value?.destination?.route

    Scaffold(
        bottomBar = {
            if (currentRoute != "chat") {
                NavigationBar(
                    containerColor = com.inkwell.vanderbot.ui.theme.InkSurface
                ) {
                    NavigationBarItem(
                        selected = currentRoute == "home",
                        onClick = { navController.navigate("home") { popUpTo("home") { inclusive = true } } },
                        icon = { Icon(Icons.Filled.Home, contentDescription = "Home") },
                        label = { Text("Home") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = com.inkwell.vanderbot.ui.theme.InkGreen,
                            selectedTextColor = com.inkwell.vanderbot.ui.theme.InkGreen,
                            unselectedIconColor = com.inkwell.vanderbot.ui.theme.InkTextDim,
                            unselectedTextColor = com.inkwell.vanderbot.ui.theme.InkTextDim,
                            indicatorColor = com.inkwell.vanderbot.ui.theme.InkGreen.copy(alpha = 0.12f)
                        )
                    )
                    NavigationBarItem(
                        selected = currentRoute == "files",
                        onClick = { navController.navigate("files") },
                        icon = { Icon(Icons.Filled.Folder, contentDescription = "Files") },
                        label = { Text("Files") },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = com.inkwell.vanderbot.ui.theme.InkBlue,
                            selectedTextColor = com.inkwell.vanderbot.ui.theme.InkBlue,
                            unselectedIconColor = com.inkwell.vanderbot.ui.theme.InkTextDim,
                            unselectedTextColor = com.inkwell.vanderbot.ui.theme.InkTextDim,
                            indicatorColor = com.inkwell.vanderbot.ui.theme.InkBlue.copy(alpha = 0.12f)
                        )
                    )
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(padding)
        ) {
            composable("home") {
                HomeScreen(
                    conversations = chatState.conversations,
                    documents = filesState.documents,
                    onNewChat = { chatVm.newConversation() },
                    onSelectChat = { chatVm.selectConversation(it) },
                    onNewDocument = { type ->
                        filesVm.createDocument("Untitled ${type.replaceFirstChar { it.uppercase() }}", type, "")
                        navController.navigate("files")
                    },
                    onSelectDocument = { filesVm.selectDocument(it) },
                    onNavigateToChat = { navController.navigate("chat") },
                    onNavigateToFiles = { navController.navigate("files") }
                )
            }

            composable("chat") {
                ChatScreen(
                    messages = chatState.messages,
                    isStreaming = chatState.isStreaming,
                    error = chatState.error,
                    onSend = { text, uri, bytes, mime ->
                        chatVm.sendMessage(text, uri, bytes, mime)
                    },
                    onBack = { navController.popBackStack() },
                    onClearError = { chatVm.clearError() }
                )
            }

            composable("files") {
                FilesScreen(
                    documents = filesState.documents,
                    selectedDoc = filesState.selectedDoc,
                    filter = filesState.filter,
                    isPublishing = filesState.isPublishing,
                    publishResult = filesState.publishResult,
                    onFilterChange = { filesVm.setFilter(it) },
                    onSelectDoc = { if (it.isEmpty()) filesVm.loadDocuments() else filesVm.selectDocument(it) },
                    onDeleteDoc = { filesVm.deleteDocument(it) },
                    onPublish = { filesVm.publishToGitHub(it) },
                    onClearPublishResult = { filesVm.clearPublishResult() },
                    onBack = { navController.popBackStack() }
                )
            }
        }
    }
}
