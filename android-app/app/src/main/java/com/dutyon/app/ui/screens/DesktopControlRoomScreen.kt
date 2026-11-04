package com.dutyon.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.dutyon.app.data.model.*
import com.dutyon.app.ui.theme.*

@Composable
fun DesktopControlRoomScreen(
    desktopTab: String,
    onTabSelect: (String) -> Unit,
    sites: List<MultiSiteItem>,
    incidents: List<IncidentQueueItem>,
    rosterRows: List<EmployeeRosterRow>,
    onCreateIncident: (String, String, String, String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
    ) {
        // Control Room Sub-Nav Tabs
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(CardBg)
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ControlRoomTabButton("Live Operations", "liveops", desktopTab, onTabSelect)
            ControlRoomTabButton("Incidents Queue", "incidents", desktopTab, onTabSelect)
            ControlRoomTabButton("Roster Maker", "roster", desktopTab, onTabSelect)
            ControlRoomTabButton("Sectoral Payroll", "payroll", desktopTab, onTabSelect)
        }

        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
        ) {
            when (desktopTab) {
                "liveops" -> ControlRoomLiveOps(sites)
                "incidents" -> ControlRoomIncidents(incidents, onCreateIncident)
                "roster" -> ControlRoomRoster(rosterRows)
                "payroll" -> ControlRoomPayroll()
                else -> ControlRoomLiveOps(sites)
            }
        }
    }
}

@Composable
fun ControlRoomTabButton(
    title: String,
    tabKey: String,
    currentTab: String,
    onSelect: (String) -> Unit
) {
    val selected = currentTab == tabKey
    Box(
        modifier = Modifier
            .clip(RoundedCornerShape(8.dp))
            .background(if (selected) AccentCyan else DarkBg)
            .clickable { onSelect(tabKey) }
            .padding(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Text(
            text = title,
            color = if (selected) Color.White else Color.Gray,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
fun ControlRoomLiveOps(sites: List<MultiSiteItem>) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text(
                text = "PROTECTED SITES & DISPATCH COMMAND",
                color = AccentCyan,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )
        }

        items(sites) { site ->
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBg),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(text = site.name, color = TextWhite, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        Text(text = site.location, color = Color.Gray, fontSize = 12.sp)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Guards Present: ${site.officersPresent} / ${site.officersRequired} · ${site.patrolStatus}",
                            color = AccentBlue,
                            fontSize = 12.sp
                        )
                    }

                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(6.dp))
                            .background(if (site.status == "operational") StatusGreen else StatusRed)
                            .padding(horizontal = 10.dp, vertical = 4.dp)
                    ) {
                        Text(
                            text = site.status.uppercase(),
                            color = Color.White,
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ControlRoomIncidents(
    incidents: List<IncidentQueueItem>,
    onCreateIncident: (String, String, String, String) -> Unit
) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "DISPATCH INCIDENT QUEUE",
                color = AccentCyan,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )

            Button(
                onClick = {
                    onCreateIncident(
                        "Perimeter Breach",
                        "Khwamagxaki",
                        "HIGH",
                        "Simulated perimeter intrusion alarm triggered at North Gate"
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = StatusRed),
                shape = RoundedCornerShape(8.dp)
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = Color.White)
                Spacer(modifier = Modifier.width(4.dp))
                Text("Simulate Incident", color = Color.White, fontSize = 12.sp)
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        if (incidents.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(32.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(text = "No active emergency incidents logged", color = Color.Gray)
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(incidents) { inc ->
                    Card(
                        colors = CardDefaults.cardColors(containerColor = CardBg),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "${inc.category} (${inc.site})",
                                    color = TextWhite,
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = inc.priority,
                                    color = StatusRed,
                                    fontSize = 12.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = inc.description ?: "", color = Color.LightGray, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ControlRoomRoster(rosterRows: List<EmployeeRosterRow>) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item {
            Text(
                text = "SECURITY ROSTER MAKER (4x4 AUTOMATED ROTATION)",
                color = AccentCyan,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )
        }

        items(rosterRows) { row ->
            Card(
                colors = CardDefaults.cardColors(containerColor = CardBg),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "${row.name} (${row.grade})",
                            color = TextWhite,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = row.site ?: "Unassigned",
                            color = AccentCyan,
                            fontSize = 12.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        row.shifts.forEachIndexed { dayIdx, shiftCode ->
                            Box(
                                modifier = Modifier
                                    .size(28.dp)
                                    .clip(RoundedCornerShape(4.dp))
                                    .background(
                                        when (shiftCode) {
                                            "D" -> AccentCyan
                                            "N" -> CardBg
                                            "OFF" -> DarkBg
                                            else -> DarkBg
                                        }
                                    ),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = shiftCode,
                                    color = Color.White,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ControlRoomPayroll() {
    Card(
        colors = CardDefaults.cardColors(containerColor = CardBg),
        shape = RoundedCornerShape(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "SECTORAL DETERMINATION 6 PAYROLL & TIMESHEETS",
                color = AccentCyan,
                fontSize = 12.sp,
                fontFamily = FontFamily.Monospace,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Billable Hours Ratio: 100%",
                color = TextWhite,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "All officer attendance and overtime calculations adhere to South African Security Sector Determination rules (Ordinary 12h, Sunday 1.5x, Public Holiday 2.0x).",
                color = Color.Gray,
                fontSize = 13.sp
            )
        }
    }
}
