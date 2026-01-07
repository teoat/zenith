import { secureLogger } from '@/utils/secureLogger';
import { secureRandom } from '@/utils/secureRandom';

interface TransactionFeatures {
  amount: number;
  frequency: number;
  timeOfDay: number;
  dayOfWeek: number;
  location?: string;
  merchantCategory?: string;
  previousTransactions: number[];
  userHistory: {
    totalTransactions: number;
    averageAmount: number;
    riskScore: number;
  };
}

interface FraudPrediction {
  isFraud: boolean;
  confidence: number;
  riskScore: number;
  factors: string[];
  anomalyScore: number;
  recommendations: string[];
}

interface TrainingData {
  features: TransactionFeatures;
  label: boolean; // true = fraud, false = legitimate
}

export class AIFraudDetector {
  private isolationForest: IsolationForest;
  private neuralNetwork: SimpleNeuralNetwork;
  private trained: boolean = false;
  private featureNormalizer: FeatureNormalizer;

  constructor() {
    this.isolationForest = new IsolationForest();
    this.neuralNetwork = new SimpleNeuralNetwork();
    this.featureNormalizer = new FeatureNormalizer();
  }

  // Train the AI models with historical data
  async train(trainingData: TrainingData[]): Promise<void> {
    secureLogger.info('AI_INTELLIGENCE', `Training AI models with ${trainingData.length} samples...`);

    // Prepare features for training
    const features = trainingData.map(data => this.extractFeatures(data.features));
    const labels = trainingData.map(data => data.label ? 1 : 0);

    // Normalize features
    const normalizedFeatures = this.featureNormalizer.fitTransform(features);

    // Train Isolation Forest for anomaly detection
    await this.isolationForest.fit(normalizedFeatures);

    // Train neural network for classification
    this.neuralNetwork.fit(normalizedFeatures, labels);

    this.trained = true;
    secureLogger.info('AI_INTELLIGENCE', 'AI models trained successfully');
  }

  // Predict fraud for a transaction
  async predict(transaction: TransactionFeatures): Promise<FraudPrediction> {
    if (!this.trained) {
      throw new Error('AI models not trained. Call train() first.');
    }

    const features = this.extractFeatures(transaction);
    const normalizedFeatures = this.featureNormalizer.transform([features])[0];

    // Get predictions from both models
    const anomalyScore = await this.isolationForest.predict(normalizedFeatures);
    const nnPrediction = await this.neuralNetwork.predict(normalizedFeatures);

    // Combine predictions
    const combinedScore = this.combinePredictions(anomalyScore, nnPrediction);
    const isFraud = combinedScore > 0.7; // Threshold for fraud detection
    const confidence = Math.abs(combinedScore - 0.5) * 2; // Confidence in prediction

    // Generate risk factors
    const factors = this.analyzeRiskFactors(transaction, anomalyScore, nnPrediction);

    // Generate recommendations
    const recommendations = this.generateRecommendations(transaction, combinedScore);

    return {
      isFraud,
      confidence,
      riskScore: combinedScore,
      factors,
      anomalyScore,
      recommendations
    };
  }

  // Extract numerical features from transaction data
  private extractFeatures(transaction: TransactionFeatures): number[] {
    return [
      transaction.amount,
      transaction.frequency,
      transaction.timeOfDay,
      transaction.dayOfWeek,
      transaction.previousTransactions.length,
      transaction.userHistory.totalTransactions,
      transaction.userHistory.averageAmount,
      transaction.userHistory.riskScore,
      // Add more features as needed
      this.hashString(transaction.location || ''),
      this.hashString(transaction.merchantCategory || ''),
      Math.max(...transaction.previousTransactions, 0), // Max previous amount
      transaction.previousTransactions.reduce((a, b) => a + b, 0) / Math.max(transaction.previousTransactions.length, 1), // Average previous
      transaction.previousTransactions.filter(t => t > transaction.amount).length // Count of larger transactions
    ];
  }

  // Combine predictions from multiple models
  private combinePredictions(anomalyScore: number, nnPrediction: number): number {
    // Anomaly score is typically between 0-1, higher = more anomalous
    // NN prediction is 0-1, higher = more likely fraud

    // Weighted combination
    const anomalyWeight = 0.6;
    const nnWeight = 0.4;

    return (anomalyScore * anomalyWeight) + (nnPrediction * nnWeight);
  }

  // Analyze what factors contribute to the risk score
  private analyzeRiskFactors(
    transaction: TransactionFeatures,
    anomalyScore: number,
    nnPrediction: number
  ): string[] {
    const factors: string[] = [];

    // Amount-based factors
    if (transaction.amount > transaction.userHistory.averageAmount * 3) {
      factors.push('Unusually high transaction amount');
    }

    if (transaction.amount > Math.max(...transaction.previousTransactions, 0) * 2) {
      factors.push('Significantly higher than previous transactions');
    }

    // Frequency factors
    if (transaction.frequency > 10) {
      factors.push('High transaction frequency');
    }

    // Time-based factors
    if (transaction.timeOfDay < 6 || transaction.timeOfDay > 22) {
      factors.push('Unusual transaction time');
    }

    // Anomaly-based factors
    if (anomalyScore > 0.8) {
      factors.push('Highly anomalous transaction pattern');
    }

    if (nnPrediction > 0.7) {
      factors.push('Neural network fraud prediction');
    }

    // User history factors
    if (transaction.userHistory.riskScore > 0.5) {
      factors.push('High-risk user history');
    }

    return factors;
  }

  // Generate recommendations based on risk assessment
  private generateRecommendations(
    transaction: TransactionFeatures,
    riskScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (riskScore > 0.8) {
      recommendations.push('Immediate transaction hold recommended');
      recommendations.push('Contact customer for verification');
      recommendations.push('Flag account for enhanced monitoring');
    } else if (riskScore > 0.6) {
      recommendations.push('Additional verification required');
      recommendations.push('Monitor account activity closely');
    } else if (riskScore > 0.4) {
      recommendations.push('Review transaction manually');
      recommendations.push('Check for unusual patterns');
    }

    // Specific recommendations based on factors
    if (transaction.amount > 10000) {
      recommendations.push('High-value transaction - enhanced verification needed');
    }

    if (transaction.frequency > 20) {
      recommendations.push('Suspicious transaction frequency detected');
    }

    return recommendations;
  }

  // Simple hash function for categorical data
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) / 2147483647; // Normalize to 0-1
  }

  // Get model performance metrics
  async getPerformanceMetrics(testData: TrainingData[]): Promise<{
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  }> {
    if (!this.trained) {
      throw new Error('Models not trained');
    }

    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    for (const data of testData) {
      const prediction = await this.predict(data.features);
      const actual = data.label;

      if (prediction.isFraud && actual) truePositives++;
      else if (prediction.isFraud && !actual) falsePositives++;
      else if (!prediction.isFraud && !actual) trueNegatives++;
      else if (!prediction.isFraud && actual) falseNegatives++;
    }

    const accuracy = (truePositives + trueNegatives) / testData.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return { accuracy, precision, recall, f1Score };
  }
}

// Simplified Isolation Forest implementation
class IsolationForest {
  private trees: IsolationTree[] = [];
  private numTrees: number = 100;
  private sampleSize: number = 256;

  async fit(data: number[][]): Promise<void> {
    this.trees = [];

    for (let i = 0; i < this.numTrees; i++) {
      // Sample subset of data
      const sample = this.sampleData(data, this.sampleSize);
      const tree = new IsolationTree();
      tree.fit(sample);
      this.trees.push(tree);
    }
  }

  async predict(features: number[]): Promise<number> {
    if (this.trees.length === 0) return 0;

    const scores = this.trees.map(tree => tree.score(features));
    const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Convert to anomaly score (0-1, higher = more anomalous)
    return Math.min(1, averageScore / 10);
  }

  private sampleData(data: number[][], size: number): number[][] {
    const sampled: number[][] = [];
    for (let i = 0; i < size && i < data.length; i++) {
      const randomIndex = Math.floor(secureRandom.random() * data.length);
      sampled.push(data[randomIndex]);
    }
    return sampled;
  }
}

class IsolationTree {
  private splitFeature: number = -1;
  private splitValue: number = 0;
  private leftChild: IsolationTree | null = null;
  private rightChild: IsolationTree | null = null;
  private isLeaf: boolean = false;

  fit(data: number[][]): void {
    if (data.length <= 1) {
      this.isLeaf = true;
      return;
    }

    // Randomly select feature to split on
    this.splitFeature = Math.floor(secureRandom.random() * data[0].length);

    // Find min/max values for this feature
    const values = data.map(row => row[this.splitFeature]);
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Random split value
    this.splitValue = min + secureRandom.random() * (max - min);

    // Split data
    const leftData = data.filter(row => row[this.splitFeature] < this.splitValue);
    const rightData = data.filter(row => row[this.splitFeature] >= this.splitValue);

    // Recursively build children
    this.leftChild = new IsolationTree();
    this.leftChild.fit(leftData);

    this.rightChild = new IsolationTree();
    this.rightChild.fit(rightData);
  }

  score(features: number[]): number {
    if (this.isLeaf) {
      return 1; // Base score for leaf nodes
    }

    // Traverse tree and accumulate path length
    // Traverse tree and accumulate path length
    let pathLength = 0;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let current: IsolationTree = this;

    while (!current.isLeaf) {
      pathLength++;
      if (features[current.splitFeature] < current.splitValue) {
        current = current.leftChild!;
      } else {
        current = current.rightChild!;
      }
    }

    return pathLength;
  }
}

// Simple Neural Network implementation (simplified)
class SimpleNeuralNetwork {
  private weights: number[] = [];
  private bias: number = 0;
  private inputSize: number = 0;

  fit(features: number[][], labels: number[]): void {
    this.inputSize = features[0].length;
    this.weights = Array.from({ length: this.inputSize }, () => secureRandom.random() - 0.5);
    this.bias = secureRandom.random() - 0.5;

    // Very simple training - just adjust weights based on average error
    const learningRate = 0.01;
    const epochs = 50;

    for (let epoch = 0; epoch < epochs; epoch++) {
      let totalError = 0;

      for (let i = 0; i < features.length; i++) {
        const prediction = this.predict(features[i]);
        const error = labels[i] - prediction;
        totalError += Math.abs(error);

        // Simple weight updates
        for (let j = 0; j < this.weights.length; j++) {
          this.weights[j] += learningRate * error * features[i][j];
        }
        this.bias += learningRate * error;
      }

      if (epoch % 10 === 0) {
        secureLogger.debug('AI_INTELLIGENCE', `Training Epoch ${epoch}`, { 
          avgError: totalError / features.length 
        });
      }
    }
  }

  predict(features: number[]): number {
    let sum = this.bias;
    for (let i = 0; i < features.length; i++) {
      sum += this.weights[i] * features[i];
    }
    return this.sigmoid(sum);
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }
}

// Feature normalization utility
class FeatureNormalizer {
  private means: number[] = [];
  private stds: number[] = [];

  fitTransform(data: number[][]): number[][] {
    if (data.length === 0) return data;

    const numFeatures = data[0].length;
    this.means = Array(numFeatures).fill(0);
    this.stds = Array(numFeatures).fill(0);

    // Calculate means
    for (const row of data) {
      for (let i = 0; i < numFeatures; i++) {
        this.means[i] += row[i];
      }
    }
    this.means = this.means.map(mean => mean / data.length);

    // Calculate standard deviations
    for (const row of data) {
      for (let i = 0; i < numFeatures; i++) {
        this.stds[i] += Math.pow(row[i] - this.means[i], 2);
      }
    }
    this.stds = this.stds.map(std => Math.sqrt(std / data.length));

    return this.transform(data);
  }

  transform(data: number[][]): number[][] {
    return data.map(row =>
      row.map((value, i) => {
        const std = this.stds[i] || 1;
        return std > 0 ? (value - this.means[i]) / std : 0;
      })
    );
  }
}

// Integration with existing fraud detection engine
export class AIFraudDetectionEngine {
  private aiDetector: AIFraudDetector;
  private trained: boolean = false;

  constructor() {
    this.aiDetector = new AIFraudDetector();
  }

  // Initialize with training data
  async initialize(): Promise<void> {
    // Generate synthetic training data for demonstration
    const trainingData = this.generateTrainingData();
    await this.aiDetector.train(trainingData);
    this.trained = true;
  }

  // Analyze transaction with AI
  async analyzeTransaction(transaction: TransactionFeatures): Promise<FraudPrediction> {
    if (!this.trained) {
      await this.initialize();
    }

    return await this.aiDetector.predict(transaction);
  }

  // Generate synthetic training data
  private generateTrainingData(): TrainingData[] {
    const data: TrainingData[] = [];

    // Generate legitimate transactions
    for (let i = 0; i < 1000; i++) {
      data.push({
        features: {
          amount: secureRandom.random() * 1000 + 10, // $10-$1010
          frequency: Math.floor(secureRandom.random() * 5) + 1, // 1-5 transactions
          timeOfDay: Math.floor(secureRandom.random() * 24), // 0-23 hours
          dayOfWeek: Math.floor(secureRandom.random() * 7), // 0-6 days
          location: 'local',
          merchantCategory: 'retail',
          previousTransactions: Array.from({ length: 10 }, () => secureRandom.random() * 500 + 20),
          userHistory: {
            totalTransactions: Math.floor(secureRandom.random() * 100) + 10,
            averageAmount: secureRandom.random() * 300 + 50,
            riskScore: secureRandom.random() * 0.3 // Low risk for legitimate
          }
        },
        label: false
      });
    }

    // Generate fraudulent transactions
    for (let i = 0; i < 200; i++) {
      data.push({
        features: {
          amount: secureRandom.random() * 5000 + 2000, // $2000-$7000 (unusually high)
          frequency: Math.floor(secureRandom.random() * 20) + 10, // 10-30 transactions (high frequency)
          timeOfDay: secureRandom.random() < 0.7 ? Math.floor(secureRandom.random() * 6) : Math.floor(secureRandom.random() * 6) + 18, // Unusual hours
          dayOfWeek: Math.floor(secureRandom.random() * 7),
          location: secureRandom.random() < 0.5 ? 'international' : 'local',
          merchantCategory: secureRandom.random() < 0.5 ? 'high-risk' : 'retail',
          previousTransactions: Array.from({ length: 5 }, () => secureRandom.random() * 100 + 5), // Fewer previous transactions
          userHistory: {
            totalTransactions: Math.floor(secureRandom.random() * 20) + 1, // New user
            averageAmount: secureRandom.random() * 100 + 10, // Low average
            riskScore: secureRandom.random() * 0.7 + 0.3 // Higher risk
          }
        },
        label: true
      });
    }

    return data;
  }

  // Get AI model performance
  async getModelPerformance(): Promise<any> {
    if (!this.trained) return null;

    const testData = this.generateTrainingData().slice(0, 200); // Use subset for testing
    return await this.aiDetector.getPerformanceMetrics(testData);
  }
}

// Global AI fraud detection instance
export const aiFraudDetector = new AIFraudDetectionEngine();