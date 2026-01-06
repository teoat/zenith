#!/usr/bin/env python3
"""
Feedback Processing Service
Automated feedback collection, analysis, and response management
"""

import json
import time
import datetime
import sqlite3
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import asyncio
from enum import Enum

class FeedbackType(Enum):
    CONTENT_QUALITY = "content_quality"
    FEATURE_REQUEST = "feature_request"
    BUG_REPORT = "bug_report"
    USER_EXPERIENCE = "user_experience"
    GENERAL = "general"

class FeedbackStatus(Enum):
    PENDING = "pending"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    REJECTED = "rejected"
    AUTO_CLOSED = "auto_closed"

@dataclass
class FeedbackItem:
    id: str
    user_id: str
    document_id: Optional[str]
    rating: int
    feedback_type: FeedbackType
    category: str
    comment: str
    timestamp: datetime.datetime
    helpful_score: int
    metadata: Dict[str, Any]
    resolved: bool = False
    response_sent: bool = False
    responded_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    auto_responses: List[str] = None
    tags: List[str] = None
    resolution_time: Optional[datetime] = None
    
    def __post_init__(self):
        if self.auto_responses is None:
            self.auto_responses = []
        if self.tags is None:
            self.tags = []

class FeedbackProcessingService:
    """Automated feedback processing and analysis"""
    
    def __init__(self):
        self.feedback_queue = asyncio.Queue()
        self.processed_feedback = asyncio.Queue()
        self.feedback_cache = {}
        self.feedback_db = "feedback.db"
        
    async def process_feedback_queue(self):
        """Process feedback queue continuously"""
        while True:
            try:
                # Get next feedback item
                feedback_item = await self.feedback_queue.get()
                
                if feedback_item:
                    print(f"Processing feedback {feedback_item.id}")
                    
                    # Mark as in progress
                    feedback_item.status = FeedbackStatus.IN_REVIEW
                    await self._mark_feedback_in_review(feedback_item.id)
                    
                    # Process feedback
                    result = await self._process_feedback_item(feedback_item)
                    
                    # Update status
                    # await self._update_feedback_status(feedback_item.id, result.status)
                    
                    # Mark as completed
                    feedback_item.status = FeedbackStatus.RESOLVED
                    await self._mark_feedback_completed(feedback_item.id)
                    
                    # Queue next item
                    await self.feedback_queue.task_done()
                
            except Exception as e:
                print(f"Error processing feedback: {e}")
                break
        
        print("Feedback processing stopped")
    
    async def _mark_feedback_in_review(self, feedback_id: str) -> None:
        """Mark feedback as in review"""
        try:
            # Update in database
            with sqlite3.connect(self.feedback_db) as conn:
                cursor = conn.cursor()
                cursor.execute('UPDATE feedback SET status = ? WHERE id = ?', (FeedbackStatus.IN_REVIEW.value, feedback_id))
                cursor.execute('''
                    UPDATE feedback SET reviewed_by = ?, reviewed_at = ? WHERE id = ?
                ''', ('auto_moderator', datetime.datetime.utcnow(), feedback_id))
                
            conn.commit()
        except Exception as e:
            print(f"Error marking feedback {feedback_id} for review: {e}")
    
    async def _mark_feedback_completed(self, feedback_id: str) -> None:
        """Mark feedback as completed"""
        try:
            with sqlite3.connect(self.feedback_db) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE feedback SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?
                ''', (FeedbackStatus.RESOLVED.value, datetime.datetime.utcnow(), 'auto_moderator', feedback_id))
            conn.commit()
        except Exception as e:
            print(f"Error marking feedback {feedback_id} as completed")
    
    async def _process_feedback_item(self, feedback_item: Dict[str, Any]) -> Dict[str, Any]:
        """Process individual feedback item"""
        
        feedback_id = feedback_item['id']
        user_id = feedback_item.get('user_id')
        feedback_type = feedback_item.get('feedback_type', FeedbackType.GENERAL)
        
        print(f"Processing feedback {feedback_id}: {feedback_item.get('category')} - {feedback_item.get('rating')}/5")
        
        # Analyze feedback
        analysis = self._analyze_feedback_content(feedback_item)
        insights = self._generate_feedback_insights(feedback_item)
        
        # Auto-categorize if needed
        if not self._is_category_allowed(feedback_type):
            # Mark for manual review
            await self._mark_feedback_in_review(feedback_id)
            return {
                'status': FeedbackStatus.IN_REVIEW,
                'reason': f"Manual review required for: {feedback_type}"
            }
        
        # Generate auto-response if enabled
        auto_response = None
        if feedback_type == FeedbackType.BUG_REPORT:
            auto_response = self._generate_bug_fix_response(feedback_item)
        elif feedback_type == FeedbackType.USER_EXPERIENCE:
            auto_response = self._generate_improvement_suggestions(feedback_item)
        
        # Update database
        feedback_item['status'] = FeedbackStatus.RESOLVED
        feedback_item['processed_at'] = datetime.datetime.utcnow()
        feedback_item['resolved_by'] = 'auto_moderator'
        
        # Send response
        if auto_response:
            await self._send_feedback_response(feedback_item, auto_response)
        
        return {
            'status': feedback_item['status'],
            'insights': analysis.get('insights'),
            'auto_response': auto_response
        }
    
    def _is_category_allowed(self, feedback_type: FeedbackType) -> bool:
        """Check if category type is allowed"""
        return feedback_type != FeedbackType.FEATURE_REQUEST  # Requires human review
        return feedback_type not in [FeedbackType.FEATURE_REQUEST, FeedbackType.BUG_REPORT]
    
    def _analyze_feedback_content(self, feedback_item: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze feedback content for insights"""
        
        content = feedback_item.get('comment', '')
        feedback_type = feedback_item.get('feedback_type')
        
        analysis = {
            'sentiment': self._analyze_sentiment(content),
            'key_themes': self._extract_key_themes(content),
            'urgency_level': self._assess_urgency(feedback_item),
            'action_items': self._identify_action_items(content)
        }
        
        return analysis
    
    def _analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze sentiment of feedback"""
        
        # Simple sentiment analysis
        positive_words = ['good', 'great', 'excellent', 'helpful', 'useful', 'effective']
        negative_words = ['bad', 'poor', 'terrible', 'useless', 'ineffective']
        neutral_words = ['okay', 'fine', 'average', 'decent', 'unremarkable']
        
        words = text.lower().split()
        
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        neutral_count = sum(1 for word in words if word in neutral_words)
        
        total_words = len(words)
        
        if total_words == 0:
            return {
                'sentiment': 'neutral',
                'confidence': 0.5
            }
        
        if total_words > 0:
            sentiment_score = (positive_count - negative_count) / total_words
            
            if sentiment_score > 0.7:
                sentiment = 'positive'
            elif sentiment_score > 0.5:
                sentiment = 'mixed_positive'
            elif sentiment_score > 0.3:
                sentiment = 'neutral'
            elif sentiment_score > 0.2:
                sentiment = 'mixed_negative'
            else:
                sentiment = 'negative'
        
        return {
            'sentiment': sentiment,
            'positive_count': positive_count,
            'negative_count': negative_count,
            'neutral_count': neutral_count,
            'total_words': total_words,
            'confidence': sentiment_score
        }
    
    def _extract_key_themes(self, text: str) -> List[str]:
        """Extract key themes from feedback"""
        
        # Common fraud investigation themes
        fraud_themes = [
            'payment_patterns',
            'user_behavior',
            'data_quality',
            'system_performance',
            'investigation_time',
            'evidence_issues',
            'user_cooperation',
            'tool_effectiveness'
        ]
        
        technical_themes = [
            'api_integration',
            'code_quality',
            'performance_issues',
            'error_handling',
            'documentation_clarity',
            'api_accuracy',
            'deployment_complexity',
            'system_errors'
        ]
        
        found_themes = []
        for theme in fraud_themes + technical_themes:
            if any(keyword in text.lower() for keyword in theme.split('_')):
                found_themes.append(theme)
        return found_themes
    
    def _assess_urgency(self, feedback_item: Dict[str, Any]) -> str:
        """Assess urgency of feedback"""
        
        category = feedback_item.get('category', '')
        rating = feedback_item.get('rating', 0)
        
        urgency = 'low'
        if rating >= 4:
            urgency = 'medium'
        elif rating >= 3:
            urgency = 'high'
        elif rating <= 2:
            urgency = 'critical'
        
        return urgency
    
    def _identify_action_items(self, text: str) -> List[str]:
        """Identify action items from feedback"""
        
        action_keywords = [
            'implement', 'improve', 'fix', 'investigate', 'document', 'update', 'configure', 'optimize'
        ]
        
        action_items = []
        
        for keyword in action_keywords:
            if keyword in text.lower():
                action_items.append(f"improve_{keyword}")
        
        return list(set(action_items))
    
    def _generate_bug_fix_response(self, feedback_item: Dict[str, Any]) -> str:
        """Generate bug fix response"""
        
        issue_id = hashlib.md5(f"bug_{int(time.time())}".encode()).hexdigest()
        
        response = f"""
Thank you for reporting this bug issue (Reference: {issue_id}).

## Issue Analysis
We've analyzed your report and identified the following:

**Issue Category**: {feedback_item.get('category', 'Unknown')}
**Priority**: High

**Root Cause**: Analysis of {feedback_item.get('comment', '')}

## Recommended Actions
1. **Immediate**: Apply temporary workaround if applicable
2. **Investigation**: Our team will investigate this issue further
3. **Documentation**: We will update the documentation to prevent similar issues
4. **Follow-up**: We'll contact you once the issue is resolved

## Timeline
- **Investigation**: Started immediately
- **Follow-up**: Within 24 hours
- **Resolution**: Within 72 hours
- **Documentation**: Within 7 days

## Additional Information
- **Environment**: {feedback_item.get('metadata', {}).get('environment', 'Unknown')}
- **Version**: {feedback_item.get('metadata', {}).get('platform_version', 'Unknown')}
- **User Agent**: {feedback_item.get('user_agent', 'Unknown')}

## Contact
For updates on this issue, please reference: #{issue_id}

Best regards,
378x492 Support Team
"""
        
        return response
    
    def _generate_improvement_suggestions(self, feedback_item: Dict[str, Any]) -> List[str]:
        """Generate improvement suggestions"""
        
        insights = feedback_item.get('insights', {})
        
        suggestions = []
        
        # Category-specific improvements
        if feedback_item.get('category') == 'api':
            suggestions = [
                "Improve API response time",
                "Add more detailed error messages",
                "Implement API rate limiting",
                "Add automated testing for critical endpoints",
                "Document edge cases",
                "Add SDK examples"
            ]
        
        elif feedback_item.get('category') == 'ui':
            suggestions = [
                "Improve page performance",
                "Fix navigation issues",
                "Add more interactive elements",
                "Improve mobile responsiveness",
                "Add keyboard navigation",
                "Improve accessibility compliance"
            ]
        
        elif feedback_item.get('category') == 'security':
            suggestions = [
                "Review authentication flows",
                "Add additional security checks",
                "Document security best practices",
                "Implement security monitoring",
                "Review access control implementation"
            ]
        
        elif feedback_item.get('category') == 'content':
            suggestions = [
                "Expand with more practical examples",
                "Add more visual aids and diagrams",
                "Improve technical accuracy",
                "Add cross-references",
                "Update outdated information",
                "Include real-world use cases"
            ]
        
        else:
            suggestions = [
                "Consider expanding with more details",
                "Add practical examples",
                "Improve clarity and structure",
                "Add more interactive elements"
            ]
        
        return suggestions
    
    def _send_feedback_response(self, feedback_item: Dict[str, Any], response: str) -> None:
        """Send feedback response"""
        
        if not response:
            print(f"No response to send")
            return
        
        user_email = self._get_user_email(feedback_item.get('user_id'))
        
        if user_email:
            try:
                from email.mime.text import MIMEText
                msg = MIMEText()
                
                msg.set_param("Subject", f"Update on Your Feedback (#{feedback_item['id']})")
                msg.set_param("From", "378x492 Support")
                
                # Create HTML email
                html_content = f"""
                <h2>Update on Your Feedback</h2>
                <p>Dear User,</p>
                <p>Thank you for your feedback regarding {feedback_item.get('title', '')}.</p>
                <p><strong>Issue ID:</strong> #{feedback_item['id']}</p>
                <p><strong>Status:</strong> {feedback_item.get('status', 'Unknown')}</p>
                <p><strong>Our Response:</strong></p>
                <p>{response}</p>
                
                <p>Best regards,<br/>The 378x492 Support Team</p>
            """
                
                msg.attach(MIMEText(html_content))
                msg.send(to=user_email)
                print(f"Response sent to {user_email}")
            except Exception as e:
                print(f"Failed to send email to {user_email}: {e}")
                return
        
        print(f"Response sent to {user_email}")

    def _get_user_email(self, user_id: str) -> Optional[str]:
        """Get user email from user_id"""
        # This would typically query a user database
        # For now, return a default
        return f"user.{user_id}@example.com"
    
    def process_feedback_queue(self):
        """Process feedback queue continuously"""
        asyncio.create_task(self._process_feedback_queue())
    
    def _mark_feedback_in_review(self, feedback_id: str) -> None:
        """Mark feedback as in review"""
        try:
            with sqlite3.connect(self.feedback_db) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE feedback SET status = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?
                ''', (FeedbackStatus.IN_REVIEW.value, 'auto_moderator', datetime.datetime.utcnow(), feedback_id))
                conn.commit()
        except Exception as e:
                print(f"Error marking feedback {feedback_id} for review: {e}")
    
    def _mark_feedback_completed(self, feedback_id: str) -> None:
        """Mark feedback as completed"""
        try:
            with sqlite3.connect(self.feedback_db) as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    UPDATE feedback SET status = ?, resolved_at = ?, resolved_by = ? WHERE id = ?
                ''', (FeedbackStatus.RESOLVED.value, datetime.datetime.utcnow(), self._get_assigned_reviewer(feedback_id), feedback_id))
                conn.commit()
        except Exception as e:
                print(f"Error marking feedback {feedback_id} as completed: {e}")
    
    def _get_assigned_reviewer(self, feedback_id: str) -> Optional[str]:
        """Get assigned reviewer for feedback"""
        # This would query the user database
        # For now, return a default
        return "investigator@example.com"
    
    def send_email_notification(self, subject: str, body: str) -> None:
        """Send email notification"""
        # Implementation would connect to email service
        print(f"Email notification sent: {subject}")

def main():
    """Main feedback service function"""
    print("🔄 Starting Feedback Processing Service...")
    
    system = FeedbackProcessingService()
    system.process_feedback_queue()

if __name__ == "__main__":
    main()