from typing import List, Dict, Tuple, Union

def get_youtube_links(topic: str, youtube) -> List[Dict[str, str]]:
        try:
            search_response = youtube.search().list(
                q=topic,
                type='video',
                part='id,snippet',
                maxResults=3
            ).execute()

            videos = []
            for search_result in search_response.get('items', []):
                video_id = search_result['id']['videoId']
                video_title = search_result['snippet']['title']
                video_url = f'https://www.youtube.com/watch?v={video_id}'
                videos.append({
                    'title': video_title,
                    'url': video_url,
                    'id': video_id
                })
            return videos
        except Exception as e:
            print(f"Error fetching YouTube links: {e}")
            return []