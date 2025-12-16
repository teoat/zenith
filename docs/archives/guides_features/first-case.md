# First Case Tutorial

This tutorial will guide you through creating your first fraud investigation case in Simple378.

## 🎯 Tutorial Overview

By the end of this tutorial, you'll have:
- Created your first fraud investigation case
- Uploaded and processed evidence files
- Used AI-powered fraud detection
- Generated a case report

**Estimated time:** 15-20 minutes

## 📋 Prerequisites

- Simple378 installed and running
- Administrator account created
- Sample data available (optional)

## 🚀 Step 1: Launch Simple378

1. Open Simple378 from your applications menu
2. Log in with your administrator credentials
3. You'll see the main dashboard

## 📁 Step 2: Create Your First Case

### Access Case Creation

1. Click the **"New Case"** button in the top navigation
2. Select **"Fraud Investigation"** as the case type

### Fill Case Details

```json
{
  "title": "Suspicious Credit Card Transactions",
  "description": "Investigation of unusual credit card activity for account ending in 1234",
  "case_type": "financial_fraud",
  "priority": "high",
  "assignee": "Your Name"
}
```

**Fields to complete:**
- **Title**: Give your case a clear, descriptive name
- **Description**: Provide context about the suspected fraud
- **Case Type**: Select the most appropriate fraud category
- **Priority**: Set based on urgency and impact
- **Assignee**: Assign to yourself or a team member

### Save the Case

Click **"Create Case"** to save your new case. You'll be redirected to the case details page.

## 📎 Step 3: Upload Evidence

### Add Evidence Files

1. In the case details page, click **"Add Evidence"**
2. Choose files to upload:
   - Transaction statements (PDF)
   - Bank records (CSV/Excel)
   - Screenshots of suspicious activity
   - Email communications
   - Any other relevant documents

### Supported File Types

Simple378 supports:
- **Documents**: PDF, DOCX, XLSX, TXT
- **Images**: JPG, PNG, GIF, TIFF
- **Audio**: MP3, WAV, M4A
- **Video**: MP4, AVI, MOV
- **Archives**: ZIP, RAR (automatically extracted)

### Evidence Processing

Once uploaded, Simple378 will:
- Extract text content from documents
- Generate thumbnails for images
- Transcribe audio/video content
- Analyze metadata
- Apply AI fraud detection algorithms

**Processing Status:** Watch the progress indicator - processing typically takes 30 seconds to 2 minutes depending on file size and complexity.

## 🔍 Step 4: Review AI Fraud Analysis

### Access Fraud Detection

1. Navigate to the **"Analysis"** tab in your case
2. View the **"Fraud Risk Score"** - a number from 0-100 indicating fraud likelihood

### Understanding Risk Factors

The AI analysis provides:
- **Overall Risk Score**: Probability of fraud (0-100)
- **Risk Level**: Low/Medium/High/Critical
- **Contributing Factors**: What triggered the high score
- **Recommendations**: Suggested next steps

**Example Analysis:**
```
Risk Score: 87/100 (High Risk)

Key Factors:
• Transaction amount 5x higher than account average
• Unusual merchant category (electronics vs. normal grocery)
• Geographic anomaly (transaction in different country)
• Time pattern deviation (unusual hour for account)

Recommendations:
• Hold transaction for manual review
• Contact customer for verification
• Flag account for enhanced monitoring
```

### Manual Review

Even with AI analysis, always perform manual review:
- Cross-reference with known account patterns
- Check for legitimate explanations
- Review evidence context
- Consider customer history

## 📊 Step 5: Add Case Notes and Timeline

### Create Timeline Entries

1. Click **"Add Timeline Entry"**
2. Document your investigation steps:
   - Initial findings
   - Evidence review notes
   - AI analysis results
   - Communication with involved parties
   - Resolution decisions

### Case Notes

Use the notes section for:
- Investigation methodology
- Key findings
- Decision rationale
- Follow-up actions

## 📋 Step 6: Generate Case Report

### Access Reporting

1. Go to the **"Reports"** tab
2. Click **"Generate Report"**

### Report Components

Your report will include:
- **Executive Summary**: High-level case overview
- **Evidence Summary**: Key files and findings
- **AI Analysis Results**: Fraud detection scores and factors
- **Investigation Timeline**: Chronological case progression
- **Recommendations**: Suggested actions or resolutions

### Export Options

Export your report as:
- **PDF**: Professional formatted document
- **HTML**: Web-viewable format
- **JSON**: Structured data for integration

## ✅ Step 7: Close the Case

### Case Resolution

When investigation is complete:

1. Update case **status** to "Closed" or "Resolved"
2. Add **resolution notes** explaining the outcome
3. Set **resolution type** (Confirmed Fraud, False Positive, etc.)
4. Save final case state

### Case Archiving

Closed cases are automatically archived but remain searchable and accessible for future reference.

## 🎉 Tutorial Complete!

Congratulations! You've successfully:

✅ Created your first fraud investigation case
✅ Uploaded and processed evidence files
✅ Utilized AI-powered fraud detection
✅ Generated a comprehensive case report
✅ Closed the case with proper documentation

## 📚 Next Steps

Now that you know the basics:

1. **Explore Advanced Features**: Try batch evidence processing and collaboration tools
2. **Review Analytics**: Check system-wide fraud patterns and trends
3. **Customize Workflows**: Set up automated alerts and custom case templates
4. **Team Collaboration**: Invite team members and assign cases

## 🆘 Need Help?

- **Documentation**: Check the [Basic Usage Guide](basic-usage.md)
- **Video Tutorials**: Watch step-by-step video guides
- **Community**: Join our user community for tips and best practices
- **Support**: Contact professional support for enterprise assistance

---

**Ready for more?** Continue with the [Basic Usage Guide](basic-usage.md) to learn advanced features!