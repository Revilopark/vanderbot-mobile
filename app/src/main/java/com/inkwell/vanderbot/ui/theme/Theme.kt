package com.inkwell.vanderbot.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Inkwell dark palette — matches the ontological-theatre aesthetic
val InkDark = Color(0xFF0A0E1A)
val InkSurface = Color(0xFF12162A)
val InkCard = Color(0xFF1A1F35)
val InkBorder = Color(0x1AFFFFFF)
val InkGreen = Color(0xFF00FF88)
val InkBlue = Color(0xFF4FACFE)
val InkPurple = Color(0xFFAA66FF)
val InkCyan = Color(0xFF00D4FF)
val InkGold = Color(0xFFD4AF37)
val InkText = Color(0xFFE8E8F0)
val InkTextDim = Color(0xFF666688)
val InkRed = Color(0xFFFF4455)

private val DarkColorScheme = darkColorScheme(
    primary = InkGreen,
    secondary = InkBlue,
    tertiary = InkPurple,
    background = InkDark,
    surface = InkSurface,
    surfaceVariant = InkCard,
    onPrimary = InkDark,
    onSecondary = InkDark,
    onBackground = InkText,
    onSurface = InkText,
    onSurfaceVariant = InkTextDim,
    error = InkRed,
    outline = InkBorder
)

@Composable
fun VanderBotTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        typography = Typography(),
        content = content
    )
}
