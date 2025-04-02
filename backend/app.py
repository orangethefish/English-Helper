from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from PIL import Image
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure Gemini API
genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
model = genai.GenerativeModel('gemini-pro-vision')

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

        # Generate response from Gemini
        response = model.generate_content([prompt, img])
        
        # Parse and return the response
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