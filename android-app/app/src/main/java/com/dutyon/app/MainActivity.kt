package com.dutyon.app

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.dutyon.app.ui.components.TopAppBarComponent
import com.dutyon.app.ui.screens.*
import com.dutyon.app.ui.theme.*
import com.dutyon.app.viewmodel.DutyOnViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: DutyOnViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            DutyOnTheme {
                val activeMode by viewModel.activeMode.collectAsState()
                val mobileScreen by viewModel.mobileScreen.collectAsState()
                val desktopTab by viewModel.desktopTab.collectAsState()
                val clockTime by viewModel.clockTime.collectAsState()
                val officer by viewModel.officer.collectAsState()
                val obEntries by viewModel.obEntries.collectAsState()
                val patrolRoutes by viewModel.patrolRoutes.collectAsState()
                val safetyStatus by viewModel.safetyStatus.collectAsState()
                val messages by viewModel.messages.collectAsState()
                val sites by viewModel.sitesList.collectAsState()
                val incidents by viewModel.incidents.collectAsState()
                val rosterRows by viewModel.rosterRows.collectAsState()
                val toastMessage by viewModel.toastMessage.collectAsState()

                LaunchedEffect(toastMessage) {
                    toastMessage?.let {
                        Toast.makeText(this@MainActivity, it, Toast.LENGTH_SHORT).show()
                    }
                }

                Scaffold(
                    topBar = {
                        TopAppBarComponent(
                            appName = "Duty On",
                            clockTime = clockTime,
                            activeMode = activeMode,
                            onModeSwitch = { viewModel.setActiveMode(it) }
                        )
                    },
                    bottomBar = {
                        if (activeMode == "mobile") {
                            MobileBottomNav(
                                currentScreen = mobileScreen,
                                onSelectScreen = { viewModel.setMobileScreen(it) }
                            )
                        }
                    }
                ) { innerPadding ->
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                            .background(DarkBg)
                    ) {
                        if (activeMode == "mobile") {
                            when (mobileScreen) {
                                "home" -> MobileHomeScreen(
                                    officer = officer,
                                    onClockIn = { viewModel.doClockIn() },
                                    onClockOut = { viewModel.doClockOut() },
                                    onNavigate = { viewModel.setMobileScreen(it) }
                                )
                                "patrols" -> MobilePatrolsScreen(
                                    patrolRoutes = patrolRoutes,
                                    onScanCheckpoint = { viewModel.scanCurrentCheckpoint(it) }
                                )
                                "ob" -> MobileOBScreen(
                                    obEntries = obEntries,
                                    onAddEntry = { viewModel.addOBEntry(it) }
                                )
                                "welfare" -> MobileWelfareScreen(
                                    safetyStatus = safetyStatus,
                                    onResetPing = { viewModel.resetWelfarePing() },
                                    onTriggerDuress = { viewModel.triggerDuressPanic() },
                                    onClearDuress = { viewModel.clearDuressPanic() }
                                )
                                "chat" -> MobileChatScreen(
                                    messages = messages,
                                    onSendMessage = { viewModel.sendMessage(it) }
                                )
                                "profile" -> MobileProfileScreen(officer = officer)
                                else -> MobileHomeScreen(
                                    officer = officer,
                                    onClockIn = { viewModel.doClockIn() },
                                    onClockOut = { viewModel.doClockOut() },
                                    onNavigate = { viewModel.setMobileScreen(it) }
                                )
                            }
                        } else {
                            DesktopControlRoomScreen(
                                desktopTab = desktopTab,
                                onTabSelect = { viewModel.setDesktopTab(it) },
                                sites = sites,
                                incidents = incidents,
                                rosterRows = rosterRows,
                                onCreateIncident = { category, site, priority, desc ->
                                    viewModel.createIncident(category, site, priority, desc)
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MobileBottomNav(
    currentScreen: String,
    onSelectScreen: (String) -> Unit
) {
    NavigationBar(
        containerColor = CardBg,
        tonalElevation = 8.dp
    ) {
        val items = listOf(
            NavItem("home", "Home", Icons.Default.Home),
            NavItem("patrols", "Patrols", Icons.Default.DirectionsWalk),
            NavItem("ob", "OB Feed", Icons.Default.MenuBook),
            NavItem("welfare", "Safety", Icons.Default.Warning),
            NavItem("chat", "Comms", Icons.Default.Chat),
            NavItem("profile", "Profile", Icons.Default.Person)
        )

        items.forEach { item ->
            NavigationBarItem(
                selected = currentScreen == item.screenKey,
                onClick = { onSelectScreen(item.screenKey) },
                icon = { Icon(item.icon, contentDescription = item.label) },
                label = { Text(item.label) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = AccentCyan,
                    selectedTextColor = AccentCyan,
                    unselectedIconColor = Color.Gray,
                    unselectedTextColor = Color.Gray,
                    indicatorColor = DarkBg
                )
            )
        }
    }
}

data class NavItem(val screenKey: String, val label: String, val icon: ImageVector)
