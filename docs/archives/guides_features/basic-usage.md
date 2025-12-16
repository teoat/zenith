# Basic Usage Guide

This guide covers the core functionality and daily workflows in Simple378 Fraud Detection.

## 📋 Table of Contents

- [Dashboard Overview](#-dashboard-overview)
- [Case Management](#-case-management)
- [Evidence Handling](#-evidence-handling)
- [Fraud Analysis](#-fraud-analysis)
- [Reporting](#-reporting)
- [Settings & Configuration](#-settings--configuration)

## 🏠 Dashboard Overview

### Main Dashboard Components

The Simple378 dashboard provides a comprehensive overview of your fraud detection activities:

#### **Key Metrics Panel**
- **Active Cases**: Currently open investigations
- **High-Risk Cases**: Cases with risk score > 80
- **Today's Alerts**: New suspicious activities detected
- **Resolution Rate**: Percentage of cases resolved this month

#### **Recent Activity Feed**
- Latest case updates and status changes
- New evidence processing completions
- AI analysis results
- Team member activities

#### **Quick Actions**
- Create new case
- Upload evidence for review
- Generate reports
- Access recent cases

### Navigation

Use the sidebar to navigate between:
- **Dashboard**: Main overview
- **Cases**: Case management
- **Evidence**: Evidence library
- **Analytics**: Reports and insights
- **Settings**: System configuration

## 📁 Case Management

### Creating Cases

1. Click **"New Case"** from dashboard or sidebar
2. Select case type:
   - **Financial Fraud**: Credit card, banking, investment fraud
   - **Identity Theft**: Account takeover, synthetic identity
   - **Money Laundering**: Suspicious transaction patterns
   - **Insurance Fraud**: Claim manipulation, staged accidents
   - **Custom**: User-defined case types

3. Fill required fields:
   - **Title**: Descriptive case name
   - **Description**: Investigation context
   - **Priority**: Critical/High/Medium/Low
   - **Assignee**: Team member assignment

### Case Status Workflow

Cases progress through these statuses:
- **Draft**: Initial creation, incomplete
- **Open**: Active investigation
- **Investigating**: Deep analysis in progress
- **Pending Review**: Awaiting approval
- **Closed**: Investigation complete
- **Archived**: Long-term storage

### Case Filtering & Search

Use filters to find cases:
- **Status**: Filter by investigation status
- **Priority**: Focus on urgent cases
- **Assignee**: View your assigned cases
- **Date Range**: Cases within specific timeframe
- **Risk Level**: High-risk cases only
- **Search**: Full-text search across titles and descriptions

### Bulk Operations

Select multiple cases for:
- **Bulk Assignment**: Reassign to team members
- **Status Updates**: Change multiple case statuses
- **Priority Changes**: Adjust urgency levels
- **Export**: Generate combined reports

## 📎 Evidence Handling

### Uploading Evidence

#### Single File Upload
1. Navigate to case details
2. Click **"Add Evidence"**
3. Select file from file browser
4. Add metadata (optional):
   - Description
   - Source
   - Confidentiality level

#### Batch Upload
1. Click **"Batch Upload"**
2. Select multiple files
3. Configure processing options:
   - **Priority**: High/Normal/Low
   - **OCR**: Enable text extraction
   - **Thumbnails**: Generate image previews
   - **Transcription**: Convert audio/video to text

### Supported File Types

| Category | Formats | Processing |
|----------|---------|------------|
| Documents | PDF, DOCX, XLSX, TXT | Text extraction, metadata |
| Images | JPG, PNG, GIF, TIFF, BMP | OCR, thumbnail generation |
| Audio | MP3, WAV, M4A, FLAC | Transcription, speaker identification |
| Video | MP4, AVI, MOV, WMV | Frame extraction, transcription |
| Archives | ZIP, RAR, 7Z | Automatic extraction |
| Email | EML, MSG | Header parsing, attachment extraction |

### Evidence Processing

#### Automatic Processing
Simple378 automatically:
- Extracts text content from documents
- Generates thumbnails for visual files
- Transcribes audio and video content
- Analyzes file metadata
- Scans for malware and viruses
- Applies AI fraud detection algorithms

#### Processing Status
Monitor progress with status indicators:
- **Queued**: Waiting for processing
- **Processing**: Currently being analyzed
- **Completed**: Ready for review
- **Failed**: Processing error (check logs)

### Evidence Organization

#### Tagging System
- Apply custom tags for categorization
- Use predefined tags: "Financial Records", "Communications", "Images"
- Search by tags across all cases

#### Evidence Linking
- Link related evidence files
- Create evidence chains for complex cases
- View evidence relationships visually

## 🔍 Fraud Analysis

### AI-Powered Detection

#### Risk Scoring
Simple378 uses multiple AI algorithms:
- **Isolation Forest**: Unsupervised anomaly detection
- **Neural Networks**: Pattern recognition for known fraud types
- **Statistical Analysis**: Transaction pattern analysis
- **Behavioral Modeling**: Account behavior profiling

#### Risk Score Interpretation
```
0-20: Very Low Risk
21-40: Low Risk
41-60: Medium Risk
61-80: High Risk
81-100: Critical Risk
```

### Manual Analysis Tools

#### Transaction Analysis
- View transaction timelines
- Compare with historical patterns
- Identify unusual amounts, frequencies, or locations
- Cross-reference with known fraud indicators

#### Pattern Recognition
- Detect transaction sequences
- Identify velocity attacks
- Find geographic anomalies
- Spot merchant category changes

#### Evidence Correlation
- Link transactions to supporting evidence
- Cross-reference multiple data sources
- Build fraud narratives

### Alert Management

#### Alert Types
- **Automated Alerts**: AI-detected suspicious activity
- **Manual Alerts**: User-created notifications
- **Threshold Alerts**: Metric-based triggers
- **Pattern Alerts**: Behavior pattern detection

#### Alert Response
1. **Review**: Examine alert details and evidence
2. **Investigate**: Create or update case
3. **Escalate**: Assign to appropriate team member
4. **Resolve**: Mark as false positive or confirmed fraud

## 📊 Reporting

### Standard Reports

#### Case Reports
- **Executive Summary**: High-level case overview
- **Investigation Timeline**: Chronological progression
- **Evidence Summary**: Key findings and files
- **AI Analysis Results**: Fraud detection scores
- **Recommendations**: Suggested actions

#### Analytics Reports
- **Case Volume**: Monthly case statistics
- **Resolution Times**: Average investigation duration
- **Fraud Types**: Distribution by fraud category
- **Risk Distribution**: Cases by risk level
- **Team Performance**: Investigator productivity metrics

### Custom Reports

#### Report Builder
Create custom reports with:
- **Data Sources**: Cases, transactions, evidence
- **Filters**: Date ranges, case types, risk levels
- **Metrics**: Custom calculations and KPIs
- **Visualizations**: Charts, graphs, tables

#### Scheduled Reports
- Set up automated report generation
- Configure delivery: Email, dashboard, export
- Define frequency: Daily, weekly, monthly

### Export Options

Export reports in multiple formats:
- **PDF**: Professional formatted documents
- **Excel**: Spreadsheet data for analysis
- **CSV**: Raw data for external tools
- **JSON**: Structured data for APIs

## ⚙️ Settings & Configuration

### User Preferences

#### Interface Settings
- **Theme**: Light/Dark mode
- **Language**: Interface language selection
- **Notifications**: Alert preferences
- **Dashboard Layout**: Customize widget arrangement

#### Security Settings
- **Session Timeout**: Automatic logout duration
- **Password Policy**: Complexity requirements
- **Two-Factor Authentication**: Additional security layer

### System Configuration

#### Case Management
- **Default Priorities**: Set priority defaults
- **Case Numbering**: Configure case ID format
- **Workflow Templates**: Predefined investigation steps

#### Evidence Processing
- **File Size Limits**: Maximum upload sizes
- **Processing Priorities**: Default processing settings
- **Storage Quotas**: Per-user storage limits

#### Integration Settings
- **Email Configuration**: SMTP settings for notifications
- **API Access**: External system integrations
- **Export Destinations**: Default export locations

### Team Management

#### User Roles
- **Administrator**: Full system access
- **Investigator**: Case management and analysis
- **Analyst**: Read-only access with reporting
- **Viewer**: Basic dashboard access

#### Permissions
Configure granular permissions:
- **Case Creation**: Who can create cases
- **Evidence Upload**: File upload restrictions
- **Report Generation**: Access to sensitive reports
- **System Settings**: Configuration access

## 🚀 Advanced Features

### Keyboard Shortcuts

Common shortcuts:
- `Ctrl+N`: New case
- `Ctrl+F`: Search cases
- `Ctrl+U`: Upload evidence
- `F1`: Help documentation
- `Esc`: Close dialogs

### Search & Filters

#### Advanced Search
- **Full-text search**: Across all case content
- **Field-specific search**: Title, description, assignee
- **Date range filters**: Created, modified, resolved dates
- **Boolean operators**: AND, OR, NOT combinations

#### Saved Filters
- Save frequently used filter combinations
- Quick access from sidebar
- Share filters with team members

### Collaboration Tools

#### Case Comments
- Add notes and observations
- @mention team members
- Threaded conversations
- File attachments in comments

#### Case Assignment
- Assign cases to team members
- Track assignment history
- Automatic load balancing
- Escalation workflows

## 🆘 Troubleshooting

### Common Issues

#### Upload Failures
- Check file size limits
- Verify supported file types
- Ensure network connectivity
- Check available storage space

#### Processing Delays
- Large files take longer to process
- Check processing queue status
- Monitor system performance
- Contact admin for priority processing

#### Access Issues
- Verify user permissions
- Check account status
- Clear browser cache
- Restart application

### Getting Help

- **In-App Help**: Press F1 for context-sensitive help
- **Documentation**: Comprehensive online guides
- **Community**: User forums and best practices
- **Support**: Professional support for enterprise users

---

**Ready to explore advanced features?** Check out the [Case Management Guide](case-management.md) for detailed workflows!