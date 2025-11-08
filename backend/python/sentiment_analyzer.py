#!/usr/bin/env python3
"""
Sentiment Analyzer using Hugging Face Transformers

This script analyzes sentiment for each segment of a video transcript
using the DistilBERT model fine-tuned for sentiment analysis.
"""

import sys
import json
import os
from typing import List, Dict, Any
import torch
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import warnings

# Set UTF-8 encoding for stdout to handle Unicode characters on Windows
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    if sys.stderr:
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")

class SentimentAnalyzer:
    def __init__(self):
        self.model_name = "distilbert-base-uncased-finetuned-sst-2-english"
        self.device = 0 if torch.cuda.is_available() else -1
        
        try:
            print("Loading sentiment analysis model...", file=sys.stderr)
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=self.model_name,
                device=self.device
            )
            print("Model loaded successfully", file=sys.stderr)
        except Exception as e:
            raise Exception(f"Failed to load sentiment model: {str(e)}")
    
    def normalize_sentiment_score(self, label: str, score: float) -> float:
        """
        Normalize sentiment scores to a range of -1 (negative) to 1 (positive).
        
        Args:
            label: Sentiment label ('POSITIVE' or 'NEGATIVE')
            score: Confidence score from the model (0-1)
            
        Returns:
            Normalized score between -1 and 1
        """
        if label == 'POSITIVE':
            return score  # 0 to 1
        else:  # NEGATIVE
            return -score  # 0 to -1
    
    def classify_sentiment(self, score: float) -> str:
        """
        Classify normalized sentiment score into categories.
        
        Args:
            score: Normalized sentiment score (-1 to 1)
            
        Returns:
            Sentiment category: 'positive', 'neutral', or 'negative'
        """
        if score > 0.1:
            return 'positive'
        elif score < -0.1:
            return 'negative'
        else:
            return 'neutral'
    
    def analyze_text_segment(self, text: str) -> Dict[str, Any]:
        """
        Analyze sentiment for a single text segment.
        
        Args:
            text: Text segment to analyze
            
        Returns:
            Dictionary with sentiment analysis results
        """
        try:
            # Skip very short text segments
            if len(text.strip()) < 3:
                return {
                    'sentiment_label': 'neutral',
                    'sentiment_score': 0.0,
                    'confidence': 0.0
                }
            
            # Truncate text if too long (BERT models have token limits)
            max_length = 512
            words = text.split()
            if len(words) > max_length:
                text = ' '.join(words[:max_length])
            
            # Get sentiment prediction
            result = self.sentiment_pipeline(text)[0]
            
            # Normalize the score
            normalized_score = self.normalize_sentiment_score(
                result['label'], 
                result['score']
            )
            
            # Classify the sentiment
            sentiment_label = self.classify_sentiment(normalized_score)
            
            return {
                'sentiment_label': sentiment_label,
                'sentiment_score': round(normalized_score, 4),
                'confidence': round(result['score'], 4),
                'raw_label': result['label']
            }
            
        except Exception as e:
            print(f"Warning: Failed to analyze segment: {str(e)}", file=sys.stderr)
            return {
                'sentiment_label': 'neutral',
                'sentiment_score': 0.0,
                'confidence': 0.0,
                'error': str(e)
            }
    
    def analyze_transcript(self, transcript_segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze sentiment for all transcript segments.
        
        Args:
            transcript_segments: List of transcript segments with text, start, and duration
            
        Returns:
            Dictionary containing sentiment analysis results
        """
        try:
            sentiments = []
            total_segments = len(transcript_segments)
            
            print(f"Analyzing sentiment for {total_segments} segments...", file=sys.stderr)
            
            for i, segment in enumerate(transcript_segments):
                if i % 10 == 0:  # Progress indicator
                    print(f"Processing segment {i + 1}/{total_segments}...", file=sys.stderr)
                
                text = segment.get('text', '').strip()
                timestamp = segment.get('start', 0)
                
                # Analyze sentiment for this segment
                sentiment_result = self.analyze_text_segment(text)
                
                # Add segment information
                sentiment_data = {
                    'timestamp': timestamp,
                    'sentiment_label': sentiment_result['sentiment_label'],
                    'sentiment_score': sentiment_result['sentiment_score'],
                    'text_segment': text[:200] + ('...' if len(text) > 200 else ''),  # Truncate for storage
                    'confidence': sentiment_result.get('confidence', 0.0)
                }
                
                sentiments.append(sentiment_data)
            
            # Calculate overall statistics
            scores = [s['sentiment_score'] for s in sentiments if s['sentiment_score'] != 0]
            positive_count = len([s for s in sentiments if s['sentiment_label'] == 'positive'])
            negative_count = len([s for s in sentiments if s['sentiment_label'] == 'negative'])
            neutral_count = len([s for s in sentiments if s['sentiment_label'] == 'neutral'])
            
            statistics = {
                'total_segments': total_segments,
                'positive_segments': positive_count,
                'negative_segments': negative_count,
                'neutral_segments': neutral_count,
                'average_score': round(sum(scores) / len(scores), 4) if scores else 0.0,
                'positive_percentage': round((positive_count / total_segments) * 100, 2),
                'negative_percentage': round((negative_count / total_segments) * 100, 2),
                'neutral_percentage': round((neutral_count / total_segments) * 100, 2)
            }
            
            print("Sentiment analysis completed", file=sys.stderr)
            
            return {
                'success': True,
                'sentiments': sentiments,
                'statistics': statistics
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Sentiment analysis failed: {str(e)}'
            }

def main():
    """Main function to handle command line execution."""
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python sentiment_analyzer.py "<transcript_segments_json_file>"'
        }))
        sys.exit(1)
    
    try:
        # Read transcript segments from file (to avoid Windows PowerShell JSON escaping issues)
        input_arg = sys.argv[1]
        if os.path.exists(input_arg):
            # It's a file path
            with open(input_arg, 'r', encoding='utf-8') as f:
                transcript_segments = json.load(f)
        else:
            # Try to parse as JSON string (for backward compatibility)
            transcript_segments = json.loads(input_arg)
        
        if not isinstance(transcript_segments, list):
            raise ValueError("Transcript segments must be a list")
        
        if not transcript_segments:
            print(json.dumps({
                'success': False,
                'error': 'No transcript segments provided'
            }))
            sys.exit(1)
        
        # Initialize and run sentiment analyzer
        analyzer = SentimentAnalyzer()
        result = analyzer.analyze_transcript(transcript_segments)
        
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # Exit with appropriate code
        sys.exit(0 if result['success'] else 1)
        
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'error': f'Invalid JSON input: {str(e)}'
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()