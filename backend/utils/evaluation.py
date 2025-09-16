"""
Model evaluation utilities for plant disease detection
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import (
    classification_report, 
    confusion_matrix, 
    precision_recall_curve,
    roc_curve,
    auc,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
)
from sklearn.preprocessing import label_binarize
import pandas as pd
import itertools

class ModelEvaluator:
    def __init__(self, class_names):
        self.class_names = class_names
        self.num_classes = len(class_names)
        
    def evaluate_predictions(self, y_true, y_pred, y_pred_proba=None):
        """
        Comprehensive evaluation of model predictions
        
        Args:
            y_true: True labels (categorical)
            y_pred: Predicted labels (categorical) 
            y_pred_proba: Prediction probabilities (optional)
            
        Returns:
            Dictionary with evaluation metrics
        """
        
        # Convert categorical to class indices if needed
        if len(y_true.shape) > 1:
            y_true_classes = np.argmax(y_true, axis=1)
        else:
            y_true_classes = y_true
            
        if len(y_pred.shape) > 1:
            y_pred_classes = np.argmax(y_pred, axis=1)
        else:
            y_pred_classes = y_pred
        
        # Basic metrics
        accuracy = accuracy_score(y_true_classes, y_pred_classes)
        precision = precision_score(y_true_classes, y_pred_classes, average='weighted')
        recall = recall_score(y_true_classes, y_pred_classes, average='weighted')
        f1 = f1_score(y_true_classes, y_pred_classes, average='weighted')
        
        # Detailed classification report
        report = classification_report(
            y_true_classes, 
            y_pred_classes,
            target_names=self.class_names,
            output_dict=True
        )
        
        # Confusion matrix
        cm = confusion_matrix(y_true_classes, y_pred_classes)
        
        results = {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'classification_report': report,
            'confusion_matrix': cm
        }
        
        # Add ROC curves if probabilities provided
        if y_pred_proba is not None:
            roc_data = self.calculate_roc_curves(y_true, y_pred_proba)
            results['roc_curves'] = roc_data
        
        return results
    
    def calculate_roc_curves(self, y_true, y_pred_proba):
        """Calculate ROC curves for multi-class classification"""
        
        # Convert to binary format for ROC calculation
        y_true_bin = label_binarize(np.argmax(y_true, axis=1), classes=range(self.num_classes))
        
        # Calculate ROC curve for each class
        fpr = dict()
        tpr = dict()
        roc_auc = dict()
        
        for i in range(self.num_classes):
            fpr[i], tpr[i], _ = roc_curve(y_true_bin[:, i], y_pred_proba[:, i])
            roc_auc[i] = auc(fpr[i], tpr[i])
        
        # Calculate micro-average ROC curve
        fpr["micro"], tpr["micro"], _ = roc_curve(y_true_bin.ravel(), y_pred_proba.ravel())
        roc_auc["micro"] = auc(fpr["micro"], tpr["micro"])
        
        return {
            'fpr': fpr,
            'tpr': tpr,
            'auc': roc_auc
        }
    
    def plot_confusion_matrix(self, cm, title='Confusion Matrix', figsize=(12, 10)):
        """Plot confusion matrix with class names"""
        
        plt.figure(figsize=figsize)
        
        # Normalize confusion matrix
        cm_normalized = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
        
        # Create heatmap
        sns.heatmap(
            cm_normalized,
            annot=True,
            fmt='.2f',
            cmap='Blues',
            xticklabels=self.class_names,
            yticklabels=self.class_names,
            cbar_kws={'label': 'Normalized Count'}
        )
        
        plt.title(title)
        plt.xlabel('Predicted Label')
        plt.ylabel('True Label')
        plt.xticks(rotation=45, ha='right')
        plt.yticks(rotation=0)
        plt.tight_layout()
        
        return plt
    
    def plot_classification_report(self, report, title='Classification Report', figsize=(10, 8)):
        """Plot classification report as heatmap"""
        
        # Convert report to DataFrame
        df = pd.DataFrame(report).transpose()
        
        # Remove support column and summary rows for better visualization
        df_plot = df.iloc[:-3, :-1]  # Remove last 3 rows (avg metrics) and support column
        
        plt.figure(figsize=figsize)
        sns.heatmap(
            df_plot,
            annot=True,
            fmt='.3f',
            cmap='RdYlGn',
            center=0.5,
            cbar_kws={'label': 'Score'}
        )
        
        plt.title(title)
        plt.xlabel('Metrics')
        plt.ylabel('Classes')
        plt.xticks(rotation=0)
        plt.yticks(rotation=0)
        plt.tight_layout()
        
        return plt
    
    def plot_roc_curves(self, roc_data, title='ROC Curves', figsize=(10, 8)):
        """Plot ROC curves for multi-class classification"""
        
        plt.figure(figsize=figsize)
        
        # Plot ROC curve for each class
        for i in range(min(10, self.num_classes)):  # Limit to 10 classes for readability
            plt.plot(
                roc_data['fpr'][i],
                roc_data['tpr'][i],
                label=f'{self.class_names[i]} (AUC = {roc_data["auc"][i]:.2f})',
                alpha=0.7
            )
        
        # Plot micro-average ROC curve
        plt.plot(
            roc_data['fpr']['micro'],
            roc_data['tpr']['micro'],
            label=f'Micro-average (AUC = {roc_data["auc"]["micro"]:.2f})',
            linestyle='--',
            linewidth=2
        )
        
        # Plot diagonal line
        plt.plot([0, 1], [0, 1], 'k--', alpha=0.5)
        
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title(title)
        plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left')
        plt.tight_layout()
        
        return plt
    
    def calculate_per_class_metrics(self, y_true, y_pred):
        """Calculate detailed metrics for each class"""
        
        y_true_classes = np.argmax(y_true, axis=1) if len(y_true.shape) > 1 else y_true
        y_pred_classes = np.argmax(y_pred, axis=1) if len(y_pred.shape) > 1 else y_pred
        
        cm = confusion_matrix(y_true_classes, y_pred_classes)
        
        per_class_metrics = {}
        
        for i, class_name in enumerate(self.class_names):
            tp = cm[i, i]
            fp = cm[:, i].sum() - tp
            fn = cm[i, :].sum() - tp
            tn = cm.sum() - tp - fp - fn
            
            precision = tp / (tp + fp) if (tp + fp) > 0 else 0
            recall = tp / (tp + fn) if (tp + fn) > 0 else 0
            f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
            specificity = tn / (tn + fp) if (tn + fp) > 0 else 0
            
            per_class_metrics[class_name] = {
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'specificity': specificity,
                'support': cm[i, :].sum()
            }
        
        return per_class_metrics
    
    def generate_evaluation_report(self, y_true, y_pred, y_pred_proba=None, save_path=None):
        """Generate comprehensive evaluation report"""
        
        # Calculate all metrics
        results = self.evaluate_predictions(y_true, y_pred, y_pred_proba)
        per_class_metrics = self.calculate_per_class_metrics(y_true, y_pred)
        
        # Create report
        report = f"""
# Plant Disease Detection Model Evaluation Report

## Overall Performance
- **Accuracy**: {results['accuracy']:.4f}
- **Precision**: {results['precision']:.4f}
- **Recall**: {results['recall']:.4f}
- **F1-Score**: {results['f1_score']:.4f}

## Per-Class Performance
"""
        
        for class_name, metrics in per_class_metrics.items():
            report += f"""
### {class_name}
- Precision: {metrics['precision']:.4f}
- Recall: {metrics['recall']:.4f}
- F1-Score: {metrics['f1_score']:.4f}
- Specificity: {metrics['specificity']:.4f}
- Support: {metrics['support']}
"""
        
        # Save report if path provided
        if save_path:
            with open(save_path, 'w') as f:
                f.write(report)
        
        return report, results, per_class_metrics
    
    def compare_models(self, model_results, metric='accuracy'):
        """Compare multiple model results"""
        
        comparison_data = []
        
        for model_name, results in model_results.items():
            comparison_data.append({
                'Model': model_name,
                'Accuracy': results['accuracy'],
                'Precision': results['precision'],
                'Recall': results['recall'],
                'F1-Score': results['f1_score']
            })
        
        df = pd.DataFrame(comparison_data)
        
        # Plot comparison
        plt.figure(figsize=(12, 6))
        
        metrics = ['Accuracy', 'Precision', 'Recall', 'F1-Score']
        x = np.arange(len(df))
        width = 0.2
        
        for i, metric in enumerate(metrics):
            plt.bar(x + i*width, df[metric], width, label=metric, alpha=0.8)
        
        plt.xlabel('Models')
        plt.ylabel('Score')
        plt.title('Model Performance Comparison')
        plt.xticks(x + width*1.5, df['Model'], rotation=45)
        plt.legend()
        plt.ylim(0, 1)
        plt.tight_layout()
        
        return df, plt

def analyze_model_errors(y_true, y_pred, class_names, image_paths=None):
    """Analyze model prediction errors"""
    
    y_true_classes = np.argmax(y_true, axis=1) if len(y_true.shape) > 1 else y_true
    y_pred_classes = np.argmax(y_pred, axis=1) if len(y_pred.shape) > 1 else y_pred
    
    # Find misclassified samples
    misclassified = y_true_classes != y_pred_classes
    
    error_analysis = {
        'total_errors': misclassified.sum(),
        'error_rate': misclassified.mean(),
        'misclassified_indices': np.where(misclassified)[0]
    }
    
    # Analyze error patterns
    error_matrix = confusion_matrix(y_true_classes[misclassified], y_pred_classes[misclassified])
    
    # Find most common misclassifications
    common_errors = []
    for i in range(len(class_names)):
        for j in range(len(class_names)):
            if i != j and error_matrix[i, j] > 0:
                common_errors.append({
                    'true_class': class_names[i],
                    'predicted_class': class_names[j], 
                    'count': error_matrix[i, j]
                })
    
    # Sort by frequency
    common_errors.sort(key=lambda x: x['count'], reverse=True)
    
    error_analysis['common_errors'] = common_errors[:10]  # Top 10 errors
    
    return error_analysis

def calculate_confidence_calibration(y_true, y_pred_proba, n_bins=10):
    """Calculate model confidence calibration"""
    
    y_true_classes = np.argmax(y_true, axis=1) if len(y_true.shape) > 1 else y_true
    max_probs = np.max(y_pred_proba, axis=1)
    pred_classes = np.argmax(y_pred_proba, axis=1)
    
    bin_boundaries = np.linspace(0, 1, n_bins + 1)
    bin_lowers = bin_boundaries[:-1]
    bin_uppers = bin_boundaries[1:]
    
    accuracies = []
    confidences = []
    
    for bin_lower, bin_upper in zip(bin_lowers, bin_uppers):
        in_bin = (max_probs > bin_lower) & (max_probs <= bin_upper)
        prop_in_bin = in_bin.mean()
        
        if prop_in_bin > 0:
            accuracy_in_bin = (y_true_classes[in_bin] == pred_classes[in_bin]).mean()
            avg_confidence_in_bin = max_probs[in_bin].mean()
            
            accuracies.append(accuracy_in_bin)
            confidences.append(avg_confidence_in_bin)
        else:
            accuracies.append(0)
            confidences.append(0)
    
    # Calculate Expected Calibration Error (ECE)
    ece = 0
    for i, (bin_lower, bin_upper) in enumerate(zip(bin_lowers, bin_uppers)):
        in_bin = (max_probs > bin_lower) & (max_probs <= bin_upper)
        prop_in_bin = in_bin.mean()
        ece += prop_in_bin * abs(accuracies[i] - confidences[i])
    
    return {
        'accuracies': accuracies,
        'confidences': confidences,
        'expected_calibration_error': ece,
        'bin_boundaries': bin_boundaries
    }