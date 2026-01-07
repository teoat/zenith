/*
Zenith Platform Advanced Dashboard
Modern, responsive dashboard with real-time analytics and mobile optimization
*/

import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  LinearProgress,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Snackbar,
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
} from "@mui/material";
import {
  Dashboard,
  Security,
  Assessment,
  TrendingUp,
  TrendingDown,
  Notifications,
  Settings,
  Menu,
  Close,
  Refresh,
  FilterList,
  Search,
  Download,
  Share,
  Favorite,
  Visibility,
  Edit,
  Delete,
  Add,
  CheckCircle,
  Error,
  Warning,
  Info,
  Smartphone,
  Tablet,
  Laptop,
  DesktopWindows,
} from "@mui/icons-material";
import { Line, Bar, Pie, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

// Mobile-first responsive design
const useResponsiveDesign = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));

  return { isMobile, isTablet, isDesktop };
};

// Real-time data hook
const useRealTimeData = (endpoint, interval = 30000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}${endpoint}`,
        );
        if (!response.ok) throw new Error("Network response error");
        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const timer = setInterval(fetchData, interval);

    return () => clearInterval(timer);
  }, [endpoint, interval]);

  return { data, loading, error };
};

// Dashboard metrics cards
const MetricCard = ({ title, value, change, icon, color = "primary" }) => {
  const { isMobile } = useResponsiveDesign();

  return (
    <Card
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`,
        color: "white",
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          width: "100px",
          height: "100px",
          background: "rgba(255,255,255,0.1)",
          borderRadius: "50%",
          transform: "translate(30px, -30px)",
        },
      }}
    >
      <CardContent sx={{ position: "relative", zIndex: 1 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
        >
          <Box>
            <Typography
              variant={isMobile ? "h6" : "h5"}
              component="div"
              gutterBottom
            >
              {title}
            </Typography>
            <Typography
              variant={isMobile ? "h4" : "h3"}
              component="div"
              fontWeight="bold"
            >
              {value}
            </Typography>
            {change && (
              <Box display="flex" alignItems="center" mt={1}>
                {change > 0 ? (
                  <TrendingUp color="success" />
                ) : (
                  <TrendingDown color="error" />
                )}
                <Typography variant="body2" sx={{ ml: 0.5 }}>
                  {Math.abs(change)}% from last month
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: "rgba(255,255,255,0.2)",
              width: isMobile ? 40 : 56,
              height: isMobile ? 40 : 56,
            }}
          >
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
};

// Real-time fraud detection chart
const FraudDetectionChart = () => {
  const { data, loading } = useRealTimeData("/api/analytics/fraud-trends");

  const chartData = useMemo(() => {
    if (!data) return null;

    return {
      labels: data.labels || [],
      datasets: [
        {
          label: "Fraud Cases Detected",
          data: data.fraudCases || [],
          borderColor: "rgb(255, 99, 132)",
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "False Positives",
          data: data.falsePositives || [],
          borderColor: "rgb(54, 162, 235)",
          backgroundColor: "rgba(54, 162, 235, 0.5)",
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }, [data]);

  if (loading) return <CircularProgress />;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Fraud Detection Trends
        </Typography>
        {chartData && (
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: "top" },
                title: { display: false },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

// Risk assessment overview
const RiskAssessmentOverview = () => {
  const { data, loading } = useRealTimeData("/api/analytics/risk-overview");
  const { isMobile } = useResponsiveDesign();

  if (loading) return <CircularProgress />;

  const riskLevels = data?.riskLevels || {
    low: 65,
    medium: 25,
    high: 8,
    critical: 2,
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Risk Assessment Overview
        </Typography>
        <Grid container spacing={isMobile ? 1 : 2}>
          {Object.entries(riskLevels).map(([level, percentage]) => (
            <Grid item xs={6} sm={3} key={level}>
              <Box textAlign="center">
                <Typography
                  variant="h4"
                  color={
                    level === "critical"
                      ? "error"
                      : level === "high"
                        ? "warning"
                        : level === "medium"
                          ? "info"
                          : "success"
                  }
                >
                  {percentage}%
                </Typography>
                <Typography variant="body2" textTransform="capitalize">
                  {level} Risk
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  color={
                    level === "critical"
                      ? "error"
                      : level === "high"
                        ? "warning"
                        : level === "medium"
                          ? "info"
                          : "success"
                  }
                  sx={{ mt: 1, height: 6, borderRadius: 3 }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Recent cases table with mobile optimization
const RecentCasesTable = () => {
  const { data, loading } = useRealTimeData("/api/cases/recent");
  const { isMobile, isTablet } = useResponsiveDesign();

  if (loading) return <CircularProgress />;

  const cases = data?.cases || [];

  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Recent Cases</Typography>
          <Button startIcon={<FilterList />} size="small">
            Filter
          </Button>
        </Box>
        <TableContainer
          component={Paper}
          sx={{ maxHeight: isMobile ? 300 : 400 }}
        >
          <Table stickyHeader size={isMobile ? "small" : "medium"}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                {!isMobile && <TableCell>Type</TableCell>}
                <TableCell>Status</TableCell>
                <TableCell>Priority</TableCell>
                {!isTablet && <TableCell>Created</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {cases.map((case_) => (
                <TableRow key={case_.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      #{case_.id}
                    </Typography>
                  </TableCell>
                  {!isMobile && (
                    <TableCell>
                      <Chip
                        label={case_.type}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <Chip
                      label={case_.status}
                      size="small"
                      color={
                        case_.status === "resolved"
                          ? "success"
                          : case_.status === "investigating"
                            ? "warning"
                            : case_.status === "pending"
                              ? "info"
                              : "default"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={case_.priority}
                      size="small"
                      color={
                        case_.priority === "critical"
                          ? "error"
                          : case_.priority === "high"
                            ? "warning"
                            : case_.priority === "medium"
                              ? "info"
                              : "success"
                      }
                    />
                  </TableCell>
                  {!isTablet && (
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(case_.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    <IconButton size="small" color="primary">
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="secondary">
                      <Edit fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

// Mobile-optimized navigation drawer
const NavigationDrawer = ({ open, onClose, onNavigate }) => {
  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/" },
    { text: "Cases", icon: <Assessment />, path: "/cases" },
    { text: "Analytics", icon: <TrendingUp />, path: "/analytics" },
    { text: "Security", icon: <Security />, path: "/security" },
    { text: "Settings", icon: <Settings />, path: "/settings" },
  ];

  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 280, pt: 2 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          px={2}
          pb={2}
        >
          <Typography variant="h6" fontWeight="bold">
            Zenith Platform
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => {
                onNavigate(item.path);
                onClose();
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

// Floating action button with quick actions
const QuickActionsFab = () => {
  const actions = [
    {
      icon: <Add />,
      name: "New Case",
      action: () => {
        /* TODO: Implement new case action */
      },
    },
    {
      icon: <Assessment />,
      name: "Quick Scan",
      action: () => {
        /* TODO: Implement quick scan action */
      },
    },
    {
      icon: <Download />,
      name: "Export Report",
      action: () => {
        /* TODO: Implement export action */
      },
    },
  ];

  return (
    <SpeedDial
      ariaLabel="Quick actions"
      sx={{ position: "fixed", bottom: 16, right: 16 }}
      icon={<SpeedDialIcon />}
    >
      {actions.map((action) => (
        <SpeedDialAction
          key={action.name}
          icon={action.icon}
          tooltipTitle={action.name}
          onClick={action.action}
        />
      ))}
    </SpeedDial>
  );
};

// Main dashboard component
const AdvancedDashboard = () => {
  const { isMobile, isTablet } = useResponsiveDesign();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Mock data for demonstration
  const metrics = [
    {
      title: "Active Cases",
      value: "247",
      change: 12.5,
      icon: <Assessment />,
      color: "#2196f3",
    },
    {
      title: "Fraud Detected",
      value: "$2.4M",
      change: -8.2,
      icon: <Security />,
      color: "#4caf50",
    },
    {
      title: "Risk Score",
      value: "94.2%",
      change: 3.1,
      icon: <TrendingUp />,
      color: "#ff9800",
    },
    {
      title: "Response Time",
      value: "1.2s",
      change: -15.3,
      icon: <Dashboard />,
      color: "#9c27b0",
    },
  ];

  const showNotification = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const mockNotifications = [
        {
          id: 1,
          message: "High-risk transaction detected",
          type: "warning",
          time: new Date(),
        },
        {
          id: 2,
          message: "Case #1234 resolved automatically",
          type: "success",
          time: new Date(),
        },
        {
          id: 3,
          message: "System performance optimal",
          type: "info",
          time: new Date(),
        },
      ];
      setNotifications(mockNotifications);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ flexGrow: 1, bgcolor: "#f5f5f5", minHeight: "100vh" }}>
      {/* App Bar */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <Menu />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Zenith Fraud Detection Platform
          </Typography>
          <IconButton color="inherit">
            <Notifications />
          </IconButton>
          <Avatar sx={{ ml: 1 }} />
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <NavigationDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(path) => {
          /* TODO: Implement navigation */
        }}
      />

      {/* Main Content */}
      <Box sx={{ p: isMobile ? 1 : 3 }}>
        <Grid container spacing={isMobile ? 1 : 3}>
          {/* Metrics Cards */}
          {metrics.map((metric, index) => (
            <Grid item xs={12} sm={6} lg={3} key={index}>
              <MetricCard {...metric} />
            </Grid>
          ))}

          {/* Charts */}
          <Grid item xs={12} lg={8}>
            <FraudDetectionChart />
          </Grid>
          <Grid item xs={12} lg={4}>
            <RiskAssessmentOverview />
          </Grid>

          {/* Recent Cases Table */}
          <Grid item xs={12}>
            <RecentCasesTable />
          </Grid>
        </Grid>
      </Box>

      {/* Floating Action Button */}
      <QuickActionsFab />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdvancedDashboard;
