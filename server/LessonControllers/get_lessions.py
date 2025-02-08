def get_syllabus(topic: str, description: str, user_syllabus_tentative: str) -> None:
        
    questions = ["Please state the syllabus that you want to cover [if any]: "]

    # Combine the initial topic and user's input for the syllabus
    combined_syllabus = f"{topic}. {user_syllabus_tentative}"
    
    
    update_master_prompt(f"Student's syllabus: {combined_syllabus}")

    # Generate the lesson plan based on the syllabus and description
    prompt = f"""
    Based on the provided syllabus and description, generate a structured lesson plan covering all topics. 
    The topics should be organized in point form in 8 points. 
    Syllabus: {combined_syllabus}
    Description: {description}
    Format the response in points, like this:
    1. First topic
    2. Second topic
    3. ...
    ..
    8. Eighth topic
    """
    
    # Get the response from the AI model and print the syllabus in point form
    response = model.generate_content(prompt)
    try:
        # Print the AI-generated syllabus topics
        print("Drafted lesson plan:")
        print(response.text)
    except Exception as e:
        print(f"Error generating lesson plan: {e}")