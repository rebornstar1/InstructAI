from typing import List, Dict, Tuple, Union
from youtube_transcript_api import YouTubeTranscriptApi
import json


def question_numbers(video_length: float) -> int:
        if video_length < 10:
            return 2
        elif video_length < 20:
            return 3
        elif video_length < 30:
            return 4
        elif video_length < 40:
            return 5
        return 6

def safe_generate_content(prompt: str, model) -> str:
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Error generating content: {e}")
        return ""

def safe_parse_json(json_string: str) -> Dict:
    try:
        # Strip any leading/trailing whitespace and remove code block markers
        cleaned_json = json_string.strip().replace('```json', '').replace('```', '')
        return json.loads(cleaned_json)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        print(f"Problematic JSON string: {json_string}")
        return {}

def get_video_transcript(video_id: str) -> List[Dict[str, Union[str, float]]]:
    try:
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        print(video_id, transcript)
        return transcript
    except Exception as e:
        print(f"Error fetching video transcript: {e}")
        return []

def generate_video_question(transcript_segment: str, master_prompt: str, model) -> Dict[str, str]:
    prompt = f"""
    {master_prompt}
    Based on this video transcript segment:
    {transcript_segment}

    Generate a relevant question to test the student's understanding.
    Provide the question, the correct answer, and a brief explanation.

    Format your response as JSON:
    {{
        "question": "[generated question]",
        "correct_answer": "[correct answer]",
        "explanation": "[brief explanation]"
    }}
    """
    content = safe_generate_content(prompt, model)
    question_data = safe_parse_json(content)
    return question_data


def teach_with_video(transcript: List[Dict[str, Union[str, float]]], master_prompt: str, model) -> List[Dict[str, str]]:
    total_duration = sum(segment['duration'] for segment in transcript)
    num_questions = question_numbers(total_duration / 60)  # Convert to minutes
    segment_duration = total_duration / num_questions

    questions = []
    cumulative_segment = ""
    current_time = 0

    for i in range(num_questions):
        segment_end_time = (i + 1) * segment_duration if i < num_questions - 1 else total_duration

        while current_time < segment_end_time and transcript:
            segment = transcript.pop(0)
            cumulative_segment += segment['text'] + " "
            current_time += segment['duration']

        question_data = generate_video_question(cumulative_segment, master_prompt, model)
        question_data['timestamp'] = current_time
        questions.append(question_data)
    return questions

    # # print("\nQuestions based on video content:")




    # for i, question in enumerate(questions, 1):
    #     print(f"\nQuestion {i} (Timestamp: {question['timestamp']:.2f} seconds):")
    #     print(question['question'])

    #     student_answer = input("Your answer: ")
    #     evaluation = self.evaluate_answer(student_answer, question, video['title'])

    #     print(f"Feedback: {evaluation['feedback']}")
    #     if evaluation['evaluation'] == 'correct':
    #         print("Well done!")
    #     else:
    #         print(f"The correct answer is: {question['correct_answer']}")
    #         print(f"Explanation: {question['explanation']}")

    #     input("Press Enter when you're ready to continue...")

    # print("\nVideo lesson complete.")