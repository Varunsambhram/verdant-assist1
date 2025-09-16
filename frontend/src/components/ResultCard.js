import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  CheckCircle, 
  HelpCircle, 
  Leaf, 
  Stethoscope,
  ExternalLink,
  Share2,
  Download,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ResultCard = ({ 
  result,
  onFeedback,
  onShare,
  onSaveResult,
  className 
}) => {
  if (!result) return null;

  const {
    disease,
    disease_name,
    confidence,
    treatment,
    response,
    success
  } = result;

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceVariant = (confidence) => {
    if (confidence >= 0.8) return 'default';
    if (confidence >= 0.6) return 'secondary';
    return 'destructive';
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'treat':
        return <AlertCircle className="h-4 w-4" />;
      case 'celebrate':
        return <CheckCircle className="h-4 w-4" />;
      case 'uncertain':
        return <HelpCircle className="h-4 w-4" />;
      default:
        return <Stethoscope className="h-4 w-4" />;
    }
  };

  const isHealthy = disease && disease.toLowerCase().includes('healthy');
  const isLowConfidence = confidence < 0.6;

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-primary" />
            Analysis Results
          </div>
          
          <Badge 
            variant={getConfidenceVariant(confidence)}
            className="flex items-center gap-1"
          >
            {getActionIcon(response?.action)}
            {Math.round(confidence * 100)}% Confident
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Disease Identification */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Disease Identified</h3>
            {isHealthy && <CheckCircle className="h-5 w-5 text-green-600" />}
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="font-medium text-lg">
              {disease_name || disease?.replace(/_/g, ' ')}
            </p>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Confidence Level</span>
                <span className={getConfidenceColor(confidence)}>
                  {Math.round(confidence * 100)}%
                </span>
              </div>
              <Progress 
                value={confidence * 100} 
                className="h-2"
              />
            </div>
          </div>
        </div>

        {/* AI Response */}
        {response?.message && (
          <div className="space-y-3">
            <h3 className="font-semibold">AI Assessment</h3>
            <div className={cn(
              "p-4 rounded-lg border-l-4",
              isHealthy 
                ? "bg-green-50 border-l-green-500 dark:bg-green-950" 
                : isLowConfidence
                ? "bg-yellow-50 border-l-yellow-500 dark:bg-yellow-950"
                : "bg-red-50 border-l-red-500 dark:bg-red-950"
            )}>
              <p className="text-sm leading-relaxed">
                {response.message}
              </p>
            </div>
          </div>
        )}

        {/* Treatment Recommendations */}
        {treatment && !isHealthy && (
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Stethoscope className="h-4 w-4" />
              Treatment Recommendations
            </h3>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950 dark:border-blue-800">
              <p className="text-sm leading-relaxed whitespace-pre-line">
                {treatment}
              </p>
            </div>
          </div>
        )}

        {/* Low Confidence Warning */}
        {isLowConfidence && (
          <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  Low Confidence Detection
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  The AI is not very confident about this diagnosis. 
                  Consider taking a clearer photo or consulting with an agricultural expert.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFeedback?.('positive')}
            className="gap-2"
          >
            <ThumbsUp className="h-4 w-4" />
            Helpful
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFeedback?.('negative')}
            className="gap-2"
          >
            <ThumbsDown className="h-4 w-4" />
            Not Helpful
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onShare}
            className="gap-2"
          >
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onSaveResult}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Save
          </Button>
        </div>

        {/* Additional Resources */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">
            Need more help?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Contact Local Expert
            </Button>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Learn More About {disease_name}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultCard;