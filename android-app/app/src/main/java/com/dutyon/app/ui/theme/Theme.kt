package com.dutyon.app.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val DarkBg = Color(0xFF071726)
val CardBg = Color(0xFF0E2A45)
val AccentCyan = Color(0xFF1FA6C9)
val AccentBlue = Color(0xFF3FC9E9)
val TextWhite = Color(0xFFEAF3F8)
val StatusGreen = Color(0xFF10B981)
val StatusRed = Color(0xFFEF4444)
val StatusAmber = Color(0xFFF59E0B)

private val DutyOnDarkColorScheme = darkColorScheme(
    primary = AccentCyan,
    secondary = AccentBlue,
    background = DarkBg,
    surface = CardBg,
    onPrimary = Color.White,
    onSecondary = Color.Black,
    onBackground = TextWhite,
    onSurface = TextWhite
)

val DutyOnTypography = Typography(
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        color = TextWhite
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        color = TextWhite
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        color = TextWhite
    ),
    labelSmall = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Medium,
        fontSize = 11.sp,
        color = AccentBlue
    )
)

@Composable
fun DutyOnTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = DutyOnDarkColorScheme,
        typography = DutyOnTypography,
        content = content
    )
}
