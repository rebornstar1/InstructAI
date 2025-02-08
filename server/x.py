import google.generativeai as genai
from typing import List, Dict, Tuple, Union
import json
import time
from youtube_transcript_api import YouTubeTranscriptApi
from googleapiclient.discovery import build

genai.configure(api_key='AIzaSyCV60zoY-_EqQbOlNgF_YhFmFHmMBXjZC4')
class AITeacher:
    def __init__(self,initial_master_prompt, model_name='gemini-pro', ):
        self.model = genai.GenerativeModel(model_name)
        self.student_level = "beginner"
        self.current_topic = None
        self.taught_topics = []
        self.master_prompt = "You are an adaptive AI teacher. Tailor your responses to the student's current level."
        self.master_prompt+=initial_master_prompt
        self.student_understanding = {}
        self.learning_style = None
        self.interests = []
        self.strengths = []
        self.weaknesses = []
        self.difficulty_level = 1  # Scale of 1-5
        self.youtube = build('youtube', 'v3', developerKey='AIzaSyAZBfizFBRGNxsEu9G12oZVPlThjzX8K1k')

    def update_master_prompt(self, new_content: str):
        self.master_prompt += f"\n{new_content}"

    def assess_student_profile(self):
        questions = [
            "How would you describe your preferred learning style? (e.g., visual, auditory, hands-on)",
            "What are some of your interests or hobbies? (comma-separated)",
            "In which subjects or areas do you feel most confident? (comma-separated)",
            "Are there any subjects or concepts you find particularly challenging? (comma-separated)"
        ]

        print("To personalize your learning experience, please answer a few questions:")

        self.learning_style = input(questions[0] + " ").strip().lower()
        self.interests = [interest.strip() for interest in input(questions[1] + " ").split(',')]
        self.strengths = [strength.strip() for strength in input(questions[2] + " ").split(',')]
        self.weaknesses = [weakness.strip() for weakness in input(questions[3] + " ").split(',')]

        self.update_master_prompt(f"Student's learning style: {self.learning_style}")
        self.update_master_prompt(f"Student's interests: {', '.join(self.interests)}")
        self.update_master_prompt(f"Student's strengths: {', '.join(self.strengths)}")
        self.update_master_prompt(f"Student's weaknesses: {', '.join(self.weaknesses)}")

    def safe_generate_content(self, prompt: str) -> str:
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating content: {e}")
            return ""

    def safe_parse_json(self, json_string: str) -> Dict:
        try:
            # Strip any leading/trailing whitespace and remove code block markers
            cleaned_json = json_string.strip().replace('```json', '').replace('```', '')
            return json.loads(cleaned_json)
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
            print(f"Problematic JSON string: {json_string}")
            return {}

    def assess_student_level(self, topic: str, response: str) -> str:
        prompt = f"""
        {self.master_prompt}
        Based on the student's response to the topic '{topic}', assess their understanding level.
        Student's response: {response}

        Categorize the student's level as one of the following:
        beginner, intermediate, advanced, or expert.

        Provide your assessment in the following JSON format:
        {{
            "level": "[assessed level]",
            "reasoning": "[brief explanation for this assessment]"
        }}
        """
        content = self.safe_generate_content(prompt)
        assessment = self.safe_parse_json(content)

        if 'level' in assessment and 'reasoning' in assessment:
            self.student_level = assessment['level']
            self.student_understanding[topic] = assessment['reasoning']
            self.update_master_prompt(f"Student's current level: {self.student_level}")
            self.update_master_prompt(f"Understanding of {topic}: {assessment['reasoning']}")
            return f"Based on your response, I assess your level as: {self.student_level}\nReasoning: {assessment['reasoning']}"
        else:
            return "I couldn't accurately assess your level at this time. Let's continue with the current level."

    def teach_topic(self, topic: str) -> str:
        print(f"Starting to teach the topic: {topic}")
        prompt = f"""
        {self.master_prompt}
        Provide a concise explanation of '{topic}' suitable for a {self.student_level} level student.
        The explanation should be clear, engaging, and include one or two simple examples.
        Tailor the explanation to the student's learning style ({self.learning_style}) and interests ({', '.join(self.interests)}).
        """
        explanation = self.safe_generate_content(prompt)
        self.update_master_prompt(f"Taught: {topic}\nExplanation: {explanation}")
        return explanation

    def generate_question(self, topic: str) -> Tuple[str, Dict[str, str]]:
        prompt = f"""
        {self.master_prompt}
        Generate a difficulty level {self.difficulty_level} question (scale 1-5) about '{topic}'.
        Ensure the question is directly relevant to the explanation provided.
        Include a mix of question types (MCQ, fill-in-the-blank, or short answer).

        For MCQ, provide 4 options including the correct answer.
        For fill-in-the-blank, provide the complete sentence with a blank for the missing word or phrase.
        For short answer, specify a word limit for the answer.

        Format your response as JSON:
        {{
            "question": "[generated question]",
            "type": "[MCQ/Fill-in-the-blank/Short answer]",
            "options": ["[option1]", "[option2]", "[option3]", "[option4]"] (for MCQ only),
            "correct_answer": "[correct answer]",
            "explanation": "[brief explanation of the correct answer]",
            "word_limit": [number] (for short answer only)
        }}
        """
        content = self.safe_generate_content(prompt)
        question_data = self.safe_parse_json(content)

        if 'question' in question_data:
            formatted_question = self.format_question(question_data)
            return formatted_question, question_data
        else:
            return "Could you summarize what you understood from the explanation?", {
                "type": "Short answer",
                "correct_answer": "Any reasonable summary",
                "explanation": "This is a fallback question due to an error in generation."
            }

    def format_question(self, question_data: Dict[str, str]) -> str:
        question_type = question_data.get('type', 'Short answer')
        formatted_question = question_data.get('question', 'What did you learn from this topic?') + "\n"

        if question_type == "MCQ":
            for i, option in enumerate(question_data.get('options', []), start=1):
                formatted_question += f"{i}. {option}\n"
        elif question_type == "Fill-in-the-blank":
            formatted_question = formatted_question.replace("___", "________")
        elif question_type == "Short answer":
            word_limit = question_data.get('word_limit', 50)
            formatted_question += f"\n(Please limit your answer to approximately {word_limit} words)"

        return formatted_question

    def evaluate_answer(self, student_answer: str, question_data: Dict[str, str], topic: str) -> Dict[str, str]:
        prompt = f"""
        {self.master_prompt}
        Evaluate the student's answer to the question about '{topic}'.
        Question: {question_data.get('question', 'N/A')}
        Question type: {question_data.get('type', 'N/A')}
        Student's answer: {student_answer}
        Correct answer: {question_data.get('correct_answer', 'N/A')}

        Provide constructive feedback and suggest next steps.
        If the student's answer is incorrect or shows lack of understanding,
        suggest reviewing specific parts of the topic.

        Format your response as JSON:
        {{
            "evaluation": "[correct/partially correct/incorrect]",
            "feedback": "[constructive feedback]",
            "next_step": "[review/advance/practice]",
            "specific_review": "[specific concept to review, if needed]"
        }}
        """
        content = self.safe_generate_content(prompt)
        evaluation = self.safe_parse_json(content)

        if not evaluation:
            evaluation = {
                "evaluation": "unclear",
                "feedback": "I'm having trouble evaluating your answer. Let's review the topic to ensure understanding.",
                "next_step": "review",
                "specific_review": topic
            }

        return evaluation

    def get_youtube_links(self, topic: str) -> List[Dict[str, str]]:
        try:
            search_response = self.youtube.search().list(
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

    def get_video_transcript(self, video_id: str) -> List[Dict[str, Union[str, float]]]:
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            print(video_id, transcript)
            return transcript
        except Exception as e:
            print(f"Error fetching video transcript: {e}")
            return []

    def generate_video_question(self, transcript_segment: str) -> Dict[str, str]:
        prompt = f"""
        {self.master_prompt}
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
        content = self.safe_generate_content(prompt)
        question_data = self.safe_parse_json(content)
        return question_data

    def teach_with_video(self, video: Dict[str, str], transcript: List[Dict[str, Union[str, float]]]):
        print(f"\nNow playing: {video['title']}")

        total_duration = sum(segment['duration'] for segment in transcript)
        num_questions = self.question_numbers(total_duration / 60)  # Convert to minutes
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

            question_data = self.generate_video_question(cumulative_segment)
            question_data['timestamp'] = current_time
            questions.append(question_data)

        print("\nQuestions based on video content:")

        for i, question in enumerate(questions, 1):
            print(f"\nQuestion {i} (Timestamp: {question['timestamp']:.2f} seconds):")
            print(question['question'])

            student_answer = input("Your answer: ")
            evaluation = self.evaluate_answer(student_answer, question, video['title'])

            print(f"Feedback: {evaluation['feedback']}")
            if evaluation['evaluation'] == 'correct':
                print("Well done!")
            else:
                print(f"The correct answer is: {question['correct_answer']}")
                print(f"Explanation: {question['explanation']}")

            input("Press Enter when you're ready to continue...")

        print("\nVideo lesson complete.")

    def question_numbers(self, video_length: float) -> int:
        if video_length < 10:
            return 2
        elif video_length < 20:
            return 3
        elif video_length < 30:
            return 4
        elif video_length < 40:
            return 5
        return 6

    def teach(self, initial_topic: str) -> None:
        self.assess_student_profile()                  # will be called once on signup
        print("Profile assessment complete.")

        self.current_topic = initial_topic
        print(f"Let's start learning about {initial_topic}!")

        while True:
            try:
                # Teach the topic
                explanation = self.teach_topic(self.current_topic)
                print(explanation)
                self.taught_topics.append(self.current_topic)

                # Generate question
                formatted_question, question_data = self.generate_question(self.current_topic)
                print(formatted_question)

                # Get student's response
                student_response = input("Your answer: ")

                # Assess student's level based on their response
                level_assessment = self.assess_student_level(self.current_topic, student_response)
                print(level_assessment)

                # Evaluate the answer
                evaluation = self.evaluate_answer(student_response, question_data, self.current_topic)
                print(f"Feedback: {evaluation['feedback']}")

                # Offer YouTube videos
                videos = self.get_youtube_links(self.current_topic)
                if videos:
                    print("\nHere are some relevant YouTube videos on this topic:")
                    for i, video in enumerate(videos, 1):
                        print(f"{i}. {video['title']} - {video['url']}")

                    choice = input("\nChoose a video to watch (1-3), or press Enter to skip: ")
                    print("videos", videos)
                    if choice.isdigit() and 1 <= int(choice) <= 3:
                        transcript = self.get_video_transcript(videos[int(choice) - 1]['id'])
                        if transcript:
                            self.teach_with_video(videos[int(choice) - 1], transcript)

                if evaluation['next_step'] == 'review':
                    print(f"Let's review this specific concept: {evaluation['specific_review']}")
                    self.current_topic = evaluation['specific_review']
                elif evaluation['next_step'] == 'advance':
                    print("Great job! Let's move on to the next topic.")
                    new_topic = input("What topic would you like to learn about next? (Type 'exit' to end) ")
                    if new_topic.lower() == 'exit':
                        break
                    self.current_topic = new_topic
                else:
                    print("Let's practice more with this topic.")

            except Exception as e:
                print(f"An error occurred: {e}")
                new_topic = input("What would you like to do next? (Type 'exit' to end) ")
                if new_topic.lower() == 'exit':
                    break
                self.current_topic = new_topic

        print("Thank you for learning with AI Teacher!")
        print("Topics covered in this session:")
        for topic in self.taught_topics:
            print(f"- {topic}")
        print("\nYour learning journey summary:")
        for topic, understanding in self.student_understanding.items():
            print(f"- {topic}: {understanding}")


# Usage
if __name__ == "__main__":
    teacher = AITeacher()
    teacher.teach("Introduction to Programming")