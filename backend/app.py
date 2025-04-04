from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import google.generativeai as genai
import os
from dotenv import load_dotenv
import json
import re

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API with key from environment variable
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

def clean_json_string(json_str):
    """
    Args:
        json_str (str): The JSON string to clean and parse
        
    Returns:
        dict: Parsed JSON object
        
    Raises:
        json.JSONDecodeError: If JSON parsing fails
    """
    try:
        # Remove any potential whitespace at the beginning and end
        cleaned_str = json_str.strip()
        
        # Replace escaped newlines with actual newlines
        cleaned_str = cleaned_str.replace('\\n', '\n')
        
        # Replace escaped quotes with actual quotes
        cleaned_str = cleaned_str.replace('\\"', '"')

        cleaned_str = cleaned_str.replace('```json', "").replace('```', "")
        
        # Parse the cleaned string into a Python dictionary
        parsed_json = json.loads(cleaned_str)
        
        return parsed_json
        
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
        raise

def process_image(image):
    try:
        # Convert the image to PIL Image
        img = Image.open(image)
        
        # Prepare the prompt for Gemini
        prompt = """
        Please analyze this image containing English text and provide:
        1. Extract the cloze test or reading comprehension exercise and answer any questions in Vietnamese. If it's a cloze test, return the passage as a whole. If it's a reading comprehension, don't return anything".
        2. Translate the entire passage to Vietnamese for both cloze test and reading comprehension. If it's a reading comprehension, include the translation of the question alongside with the passage"
        3. Identify words at A2 or above CEFR level and provide their Vietnamese meanings including those in the passage and those in the options. Don't include easy vocabularies.
        
        Format the response as JSON with the following structure:
        {
            "complete_passage": "...",
            "vietnamese_translation": "...",
            "new_words": [{"word": "...", "part_of_speech": "...", "meaning": "..."}]
        }
        """

        # Generate response using the model
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content([img, prompt])
        
        return response.text.replace('```json', "").replace('```', "")

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/process-image', methods=['POST'])
def handle_image():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    image = request.files['image']
    return process_image(image)

if __name__ == '__main__':
    app.run(debug=True) 