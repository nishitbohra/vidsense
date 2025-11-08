#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
YouTube Transcript Extractor

This script extracts transcripts from YouTube videos using the youtube-transcript-api.
It takes a YouTube video ID as input and returns the transcript with timestamps.
"""

import sys
import json
import os
from typing import List, Dict, Any, Optional
from youtube_transcript_api import YouTubeTranscriptApi
try:
    # Try newer API (v0.6.0+)
    from youtube_transcript_api._errors import (
        TranscriptsDisabled, 
        VideoUnavailable,
        NoTranscriptFound,
        NotTranslatable,
        TranslationLanguageNotAvailable,
        CookiePathInvalid,
        CookiesInvalid,
        FailedToCreateConsentCookie,
        NoTranscriptAvailable,
        YouTubeRequestFailed
    )
except ImportError:
    # Fallback for older versions - create dummy classes
    class TranscriptsDisabled(Exception):
        pass
    class VideoUnavailable(Exception):
        pass
    class NoTranscriptFound(Exception):
        pass
    class NotTranslatable(Exception):
        pass
    class TranslationLanguageNotAvailable(Exception):
        pass
    class CookiePathInvalid(Exception):
        pass
    class CookiesInvalid(Exception):
        pass
    class FailedToCreateConsentCookie(Exception):
        pass
    class NoTranscriptAvailable(Exception):
        pass
    class YouTubeRequestFailed(Exception):
        pass
from youtube_transcript_api.formatters import JSONFormatter

# Set UTF-8 encoding for stdout to handle Unicode characters
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    if sys.stderr:
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')
import requests
import re

def extract_video_info(video_id: str) -> Dict[str, Any]:
    """Extract basic video information from YouTube."""
    try:
        # Try to get video title from YouTube's oEmbed API
        oembed_url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        response = requests.get(oembed_url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            return {
                'title': data.get('title', f'YouTube Video {video_id}'),
                'author': data.get('author_name', 'Unknown'),
                'thumbnail': data.get('thumbnail_url', '')
            }
    except Exception as e:
        print(f"Warning: Could not fetch video info: {e}", file=sys.stderr)
    
    return {
        'title': f'YouTube Video {video_id}',
        'author': 'Unknown',
        'thumbnail': ''
    }

def clean_transcript_text(text: str) -> str:
    """Clean and normalize transcript text."""
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Remove common transcript artifacts
    text = re.sub(r'\[.*?\]', '', text)  # Remove [Music], [Applause], etc.
    text = re.sub(r'\(.*?\)', '', text)  # Remove (inaudible), etc.
    
    # Fix common punctuation issues
    text = re.sub(r'\s+([,.!?])', r'\1', text)  # Remove space before punctuation
    text = re.sub(r'([.!?])\s*([a-z])', r'\1 \2', text)  # Ensure space after sentence end
    
    return text.strip()

def extract_transcript(video_id: str) -> Dict[str, Any]:
    """
    Extract transcript from a YouTube video.
    
    Args:
        video_id: YouTube video ID
        
    Returns:
        Dictionary containing transcript data and metadata
    """
    try:
        # Get video information
        video_info = extract_video_info(video_id)
        
        # Try to get English transcript only
        transcript_list = None
        detected_language = 'en'
        
        try:
            # Try to get English transcript
            api = YouTubeTranscriptApi()
            fetched = api.fetch(video_id, languages=['en'])
            
            # Get snippets from fetched transcript
            transcript_list = [
                {
                    'text': snippet.text,
                    'start': snippet.start,
                    'duration': snippet.duration
                }
                for snippet in fetched.snippets
            ]
            
            # Detect language
            if hasattr(fetched, 'language_code'):
                detected_language = fetched.language_code
                
        except Exception as e:
            error_message = str(e)
            error_type = type(e).__name__
            
            # Check for specific error types
            if 'TranscriptsDisabled' in error_type:
                return {
                    'success': False,
                    'error': 'This video does not have captions/subtitles enabled.',
                    'error_type': 'NO_TRANSCRIPT',
                    'video_id': video_id
                }
            elif 'VideoUnavailable' in error_type:
                return {
                    'success': False,
                    'error': 'This video is unavailable, private, or does not exist.',
                    'error_type': 'VIDEO_UNAVAILABLE',
                    'video_id': video_id
                }
            elif 'NoTranscriptFound' in error_type or 'NoTranscriptAvailable' in error_type:
                return {
                    'success': False,
                    'error': 'Currently, only English videos are supported. This video does not have English captions/subtitles available. Please try a video with English captions.',
                    'error_type': 'NON_ENGLISH_TRANSCRIPT',
                    'video_id': video_id
                }
            elif 'No transcripts were found' in error_message or 'language codes' in error_message:
                return {
                    'success': False,
                    'error': 'Currently, only English videos are supported. This video does not have English captions/subtitles available. Please try a video with English captions.',
                    'error_type': 'NON_ENGLISH_TRANSCRIPT',
                    'video_id': video_id
                }
            elif '429' in error_message or 'Too Many Requests' in error_message or 'rate limit' in error_message.lower():
                return {
                    'success': False,
                    'error': 'YouTube has temporarily blocked transcript requests due to too many requests. Please wait 15-30 minutes and try again.',
                    'error_type': 'RATE_LIMITED',
                    'video_id': video_id
                }
            else:
                return {
                    'success': False,
                    'error': f'Could not retrieve English transcript: {error_message}',
                    'error_type': 'UNKNOWN_ERROR',
                    'video_id': video_id
                }
        
        # Check if we got a transcript
        if not transcript_list:
            return {
                'success': False,
                'error': 'Could not retrieve transcript from this video',
                'video_id': video_id
            }
        
        # Process transcript segments
        processed_transcript = []
        total_duration = 0
        
        for segment in transcript_list:
            cleaned_text = clean_transcript_text(segment['text'])
            if cleaned_text:  # Only include non-empty segments
                processed_segment = {
                    'text': cleaned_text,
                    'start': round(segment['start'], 2),
                    'duration': round(segment['duration'], 2)
                }
                processed_transcript.append(processed_segment)
                total_duration = max(total_duration, segment['start'] + segment['duration'])
        
        # Merge very short segments (less than 3 seconds)
        merged_transcript = merge_short_segments(processed_transcript)
        
        return {
            'success': True,
            'video_id': video_id,
            'title': video_info['title'],
            'author': video_info['author'],
            'thumbnail': video_info['thumbnail'],
            'transcript': merged_transcript,
            'total_duration': round(total_duration, 2),
            'segment_count': len(merged_transcript),
            'language': detected_language
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Transcript extraction failed: {str(e)}',
            'video_id': video_id
        }

def merge_short_segments(transcript: List[Dict[str, Any]], min_duration: float = 3.0) -> List[Dict[str, Any]]:
    """
    Merge transcript segments that are shorter than min_duration with adjacent segments.
    
    Args:
        transcript: List of transcript segments
        min_duration: Minimum duration for a segment in seconds
        
    Returns:
        List of merged transcript segments
    """
    if not transcript:
        return transcript
    
    merged = []
    current_segment = transcript[0].copy()
    
    for i in range(1, len(transcript)):
        next_segment = transcript[i]
        
        # If current segment is too short, merge with next
        if current_segment['duration'] < min_duration:
            # Combine text
            current_segment['text'] += ' ' + next_segment['text']
            # Update duration to cover both segments
            end_time = next_segment['start'] + next_segment['duration']
            current_segment['duration'] = end_time - current_segment['start']
        else:
            # Current segment is long enough, save it and start new one
            merged.append(current_segment)
            current_segment = next_segment.copy()
    
    # Don't forget the last segment
    merged.append(current_segment)
    
    return merged

def validate_video_id(video_id: str) -> bool:
    """Validate YouTube video ID format."""
    # YouTube video IDs are 11 characters long and contain alphanumeric characters, hyphens, and underscores
    pattern = r'^[a-zA-Z0-9_-]{11}$'
    return bool(re.match(pattern, video_id))

def main():
    """Main function to handle command line execution."""
    if len(sys.argv) != 2:
        print(json.dumps({
            'success': False,
            'error': 'Usage: python transcript_extractor.py <video_id>'
        }))
        sys.exit(1)
    
    video_id = sys.argv[1].strip()
    
    # Validate video ID
    if not validate_video_id(video_id):
        print(json.dumps({
            'success': False,
            'error': 'Invalid video ID format. Must be 11 characters long.'
        }))
        sys.exit(1)
    
    try:
        result = extract_transcript(video_id)
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
        # Exit with appropriate code
        sys.exit(0 if result['success'] else 1)
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'video_id': video_id
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()