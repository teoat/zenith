# backend/services/ai_training_pipeline.py
"""
Automated AI Model Training Pipeline
Handles data collection, preprocessing, model training, and deployment
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
import json
import os
from pathlib import Path
import threading
import time

from app.services.ai_fraud_detector import AIFraudDetector
from app.services.database_service import DatabaseService
from core.config import settings

logger = logging.getLogger(__name__)

class AITrainingPipeline:
    """Automated pipeline for AI model training and deployment"""

    def __init__(self):
        self.ai_detector = AIFraudDetector()
        self.db_service = DatabaseService()
        self.is_running = False
        self.last_training = None
        self.training_stats = {
            'total_trainings': 0,
            'successful_trainings': 0,
            'failed_trainings': 0,
            'last_training_duration': 0,
            'average_training_samples': 0
        }

        # Training configuration
        self.config = {
            'min_training_samples': 1000,
            'max_training_samples': 50000,
            'training_interval_hours': 24,  # Daily training
            'contamination': 0.1,
            'validation_split': 0.2,
            'min_accuracy_threshold': 0.7
        }

        # Load previous training stats
        self._load_training_stats()

    def _load_training_stats(self):
        """Load training statistics from file"""
        stats_file = Path("models/training_stats.json")
        if stats_file.exists():
            try:
                with open(stats_file, 'r') as f:
                    self.training_stats = json.load(f)
                logger.info("Loaded training statistics")
            except Exception as e:
                logger.error(f"Failed to load training stats: {e}")

    def _save_training_stats(self):
        """Save training statistics to file"""
        stats_file = Path("models/training_stats.json")
        stats_file.parent.mkdir(exist_ok=True)

        try:
            with open(stats_file, 'w') as f:
                json.dump(self.training_stats, f, indent=2)
            logger.info("Saved training statistics")
        except Exception as e:
            logger.error(f"Failed to save training stats: {e}")

    async def collect_training_data(self, days_back: int = 90) -> List[Dict[str, Any]]:
        """Collect historical transaction data for training"""
        logger.info(f"Collecting training data from last {days_back} days")

        try:
            # Calculate date range
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)

            # Query transactions from database
            query = """
            SELECT
                id, case_id, amount, currency, merchant_name, merchant_category,
                date, transaction_type, country, city, ip_address,
                device_fingerprint, user_agent, risk_score, is_flagged,
                created_at
            FROM transactions
            WHERE date >= ? AND date <= ?
            ORDER BY date DESC
            LIMIT ?
            """

            transactions = await self.db_service.execute_query(
                query,
                (start_date.isoformat(), end_date.isoformat(), self.config['max_training_samples'])
            )

            logger.info(f"Collected {len(transactions)} transactions for training")
            return transactions

        except Exception as e:
            logger.error(f"Failed to collect training data: {e}")
            return []

    def validate_training_data(self, data: List[Dict[str, Any]]) -> Tuple[bool, str]:
        """Validate training data quality"""
        if len(data) < self.config['min_training_samples']:
            return False, f"Insufficient data: {len(data)} < {self.config['min_training_samples']}"

        # Check for required fields
        required_fields = ['amount', 'date', 'merchant_name']
        for tx in data[:100]:  # Check first 100 samples
            for field in required_fields:
                if field not in tx or tx[field] is None:
                    return False, f"Missing required field: {field}"

        # Check data diversity
        amounts = [tx.get('amount', 0) for tx in data]
        if len(set(amounts)) < 10:  # Very low diversity
            return False, "Insufficient data diversity in transaction amounts"

        return True, "Data validation passed"

    def preprocess_training_data(self, raw_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Preprocess and clean training data"""
        logger.info("Preprocessing training data")

        processed_data = []

        for tx in raw_data:
            try:
                # Convert date strings to datetime objects
                if isinstance(tx.get('date'), str):
                    tx['date'] = datetime.fromisoformat(tx['date'].replace('Z', '+00:00'))

                # Ensure numeric fields are properly typed
                tx['amount'] = float(tx.get('amount', 0))
                tx['risk_score'] = float(tx.get('risk_score', 0))

                # Clean text fields
                tx['merchant_name'] = str(tx.get('merchant_name', '')).strip()
                tx['merchant_category'] = str(tx.get('merchant_category', '')).strip()

                processed_data.append(tx)

            except Exception as e:
                logger.warning(f"Failed to preprocess transaction {tx.get('id')}: {e}")
                continue

        logger.info(f"Preprocessed {len(processed_data)} transactions")
        return processed_data

    async def train_model(self) -> Dict[str, Any]:
        """Execute complete model training pipeline"""
        start_time = time.time()
        self.training_stats['total_trainings'] += 1

        try:
            logger.info("Starting AI model training pipeline")

            # Step 1: Collect training data
            raw_data = await self.collect_training_data()
            if not raw_data:
                raise Exception("No training data collected")

            # Step 2: Validate data
            is_valid, validation_message = self.validate_training_data(raw_data)
            if not is_valid:
                raise Exception(f"Data validation failed: {validation_message}")

            # Step 3: Preprocess data
            processed_data = self.preprocess_training_data(raw_data)

            # Step 4: Train model
            training_result = self.ai_detector.train_model(
                processed_data,
                contamination=self.config['contamination']
            )

            # Step 5: Validate model performance
            validation_result = await self._validate_model_performance(processed_data)

            # Step 6: Deploy model if validation passes
            if validation_result['accuracy'] >= self.config['min_accuracy_threshold']:
                await self._deploy_model()
                self.training_stats['successful_trainings'] += 1
                status = 'success'
            else:
                logger.warning(f"Model validation failed: accuracy {validation_result['accuracy']} < {self.config['min_accuracy_threshold']}")
                status = 'validation_failed'

            # Update statistics
            training_duration = time.time() - start_time
            self.training_stats['last_training_duration'] = training_duration
            self.training_stats['average_training_samples'] = (
                (self.training_stats['average_training_samples'] * (self.training_stats['total_trainings'] - 1)) +
                len(processed_data)
            ) / self.training_stats['total_trainings']

            self.last_training = datetime.now()
            self._save_training_stats()

            result = {
                'status': status,
                'training_samples': len(processed_data),
                'training_duration': training_duration,
                'validation_result': validation_result,
                'model_info': training_result,
                'timestamp': datetime.now().isoformat()
            }

            logger.info(f"AI model training completed: {status}")
            return result

        except Exception as e:
            self.training_stats['failed_trainings'] += 1
            training_duration = time.time() - start_time
            self._save_training_stats()

            logger.error(f"AI model training failed: {e}")
            return {
                'status': 'failed',
                'error': str(e),
                'training_duration': training_duration,
                'timestamp': datetime.now().isoformat()
            }

    async def _validate_model_performance(self, test_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate trained model performance"""
        logger.info("Validating model performance")

        try:
            # Use a subset for validation
            validation_size = min(500, len(test_data) // 5)
            validation_data = test_data[:validation_size]

            correct_predictions = 0
            total_predictions = len(validation_data)

            for tx in validation_data:
                try:
                    prediction = self.ai_detector.predict_fraud(tx)

                    # For validation, we'll consider transactions with risk_score > 60 as fraudulent
                    actual_fraud = tx.get('risk_score', 0) > 60 or tx.get('is_flagged', False)

                    # Check if prediction aligns with actual
                    predicted_fraud = prediction['score'] > 60

                    if actual_fraud == predicted_fraud:
                        correct_predictions += 1

                except Exception as e:
                    logger.warning(f"Validation prediction failed: {e}")
                    continue

            accuracy = correct_predictions / total_predictions if total_predictions > 0 else 0

            return {
                'accuracy': accuracy,
                'correct_predictions': correct_predictions,
                'total_predictions': total_predictions,
                'validation_samples': validation_size
            }

        except Exception as e:
            logger.error(f"Model validation failed: {e}")
            return {
                'accuracy': 0.0,
                'error': str(e)
            }

    async def _deploy_model(self):
        """Deploy the trained model to production"""
        logger.info("Deploying trained model to production")

        try:
            # The model is already saved by the train_model method
            # Here we could add additional deployment steps like:
            # - Notify other services
            # - Update model version
            # - Trigger cache invalidation

            # For now, just log the deployment
            logger.info("Model deployment completed")

        except Exception as e:
            logger.error(f"Model deployment failed: {e}")
            raise

    def should_train(self) -> bool:
        """Check if model should be trained based on schedule and conditions"""
        if not self.last_training:
            return True  # Never trained before

        hours_since_last_training = (datetime.now() - self.last_training).total_seconds() / 3600

        return hours_since_last_training >= self.config['training_interval_hours']

    async def start_automated_training(self):
        """Start automated training loop"""
        if self.is_running:
            logger.warning("Training pipeline already running")
            return

        self.is_running = True
        logger.info("Starting automated AI training pipeline")

        while self.is_running:
            try:
                if self.should_train():
                    logger.info("Starting scheduled model training")
                    result = await self.train_model()

                    if result['status'] == 'success':
                        logger.info("Scheduled training completed successfully")
                    else:
                        logger.warning(f"Scheduled training failed: {result.get('error', 'Unknown error')}")
                else:
                    logger.debug("Skipping training - not due yet")

            except Exception as e:
                logger.error(f"Automated training error: {e}")

            # Wait before next check (check every hour)
            await asyncio.sleep(3600)

    def stop_automated_training(self):
        """Stop automated training loop"""
        logger.info("Stopping automated AI training pipeline")
        self.is_running = False

    def get_training_status(self) -> Dict[str, Any]:
        """Get current training pipeline status"""
        return {
            'is_running': self.is_running,
            'last_training': self.last_training.isoformat() if self.last_training else None,
            'should_train': self.should_train(),
            'config': self.config,
            'stats': self.training_stats
        }

    async def manual_train(self, days_back: int = 90) -> Dict[str, Any]:
        """Manually trigger model training"""
        logger.info(f"Manual model training requested (last {days_back} days)")
        return await self.train_model()

# Global training pipeline instance
training_pipeline = AITrainingPipeline()

# Convenience functions for external use
async def start_ai_training():
    """Start the automated AI training pipeline"""
    await training_pipeline.start_automated_training()

def stop_ai_training():
    """Stop the automated AI training pipeline"""
    training_pipeline.stop_automated_training()

def get_training_status():
    """Get AI training pipeline status"""
    return training_pipeline.get_training_status()

async def manual_ai_training(days_back: int = 90):
    """Manually trigger AI model training"""
    return await training_pipeline.manual_train(days_back)