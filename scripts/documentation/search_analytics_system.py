#!/usr/bin/env python3
"""
Unified Search & Analytics System
Full-text search, analytics, and user behavior tracking
"""

import json
import os
import re
import time
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
import sqlite3
import hashlib

class SearchAnalyticsSystem:
    """Advanced search and analytics platform"""
    
    def __init__(self, db_path: str = "search_analytics.db"):
        self.db_path = db_path
        self.initialize_database()
        
        self.search_config = self._load_search_config()
        self.analytics_config = self._load_analytics_config()
        
    def initialize_database(self):
        """Initialize search analytics database"""
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create search analytics tables
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS search_queries (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query TEXT NOT NULL,
                    user_id TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    results_count INTEGER DEFAULT 0,
                    search_time_ms REAL,
                    selected_result_id INTEGER,
                    user_agent TEXT,
                    session_id TEXT,
                    context JSON
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS search_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    query TEXT,
                    user_id TEXT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    metadata JSON,
                    session_id TEXT
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS popular_content (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content_type TEXT,
                    content_id TEXT,
                    title TEXT NOT NULL,
                    description TEXT,
                    access_count INTEGER DEFAULT 0,
                    last_accessed DATETIME,
                    user_ratings TEXT,
                    popularity_score REAL DEFAULT 0.0
                )
            ''')
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT PRIMARY KEY,
                    user_id TEXT,
                    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_activity DATETIME,
                    page_views INTEGER DEFAULT 0,
                    search_queries INTEGER DEFAULT 0,
                    time_spent_minutes INTEGER DEFAULT 0,
                    preferences JSON,
                    device_info TEXT,
                    location TEXT
                )
            ''')
            
            conn.commit()
    
    def _load_search_config(self) -> Dict[str, Any]:
        """Load search configuration"""
        config = {
            'indexing': {
                'batch_size': 1000,
                'update_frequency': 'hourly',
                'language': 'english'
            },
            'ranking': {
                'factors': ['relevance', 'popularity', 'freshness', 'user_ratings'],
                'weights': {
                    'relevance': 0.3,
                    'popularity': 0.25,
                    'freshness': 0.2,
                    'user_ratings': 0.25
                }
            },
            'search_algorithms': {
                'full_text': 'BM25',
                'fuzzy': 'levenshtein',
                'semantic': 'transformer-based',
                'hybrid': 'keyword + semantic'
            }
        }
        
        return config
    
    def _load_analytics_config(self) -> Dict[str, Any]:
        """Load analytics configuration"""
        return {
            'tracking': {
                'page_views': True,
                'search_queries': True,
                'user_sessions': True,
                'content_popularity': True,
                'conversion_tracking': {
                    'fraud_prevention_signups': True,
                    'case_resolution_tracking': True
                },
                'performance_metrics': {
                    'search_response_time': True,
                    'page_load_time': True,
                    'user_engagement': True
                }
            }
        }
    
    def index_documentation(self, content_type: str, content_id: str, content: str, metadata: Dict[str, Any] = None) -> None:
        """Index documentation for search"""
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Create full-text search index
            cursor.execute('''
                CREATE VIRTUAL TABLE IF NOT EXISTS content_{content_type} USING fts5(content)
                ({content_id}, {content}, {title}, {description})
            ''')
            
            # Store content in popular_content table
            cursor.execute('''
                INSERT OR REPLACE INTO popular_content 
                (content_type, content_id, title, description, access_count, last_accessed, user_ratings, popularity_score)
                VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP, '[]', 0.0)
            ''', (content_type, content_id, content, metadata.get('title', ''), metadata.get('description', ''), 0, datetime.utcnow(), metadata.get('ratings', '[]'), 0.0))
            
            conn.commit()
        
        print(f"Indexed {content_type} content: {content_id}")
    
    def track_search_query(self, query: str, user_id: str, results_count: int = 0, search_time_ms: float = 0.0, selected_result_id: int = 0, user_agent: str = "", session_id: str = "") -> str:
        """Track search query and results"""
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            # Log search query
            cursor.execute('''
                INSERT INTO search_queries 
                (query, user_id, timestamp, results_count, search_time_ms, selected_result_id, user_agent, session_id, context)
                VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?, ?, ?, ?)
            ''', (query, user_id, search_time_ms, results_count, selected_result_id, user_agent, session_id, json.dumps({}) if metadata else '{}'))
            
            conn.commit()
            
            return f"search_{hashlib.md5(query)}"