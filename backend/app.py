from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API with key from environment variable
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

def process_image(image):
    try:
        # Convert the image to PIL Image
        img = Image.open(image)
        
        # Prepare the prompt for Gemini
        prompt = """
        Please analyze this image containing English text and provide:
        1. Extract and answer any questions in Vietnamese
        2. Translate the entire passage to Vietnamese
        3. Identify words at A1-A2 CEFR level and provide their Vietnamese meanings
        
        Format the response as JSON with the following structure:
        {
            "answers": [{"question": "...", "answer": "...", "explanation": "..."}],
            "vietnamese_translation": "...",
            "new_words": [{"word": "...", "part_of_speech": "...", "meaning": "..."}]
        }
        """

        # Generate response using the new client approach
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(
            contents=[img, prompt]
        )
        
        # Return the response
        return jsonify(response.text)

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