'use client';

import { useState } from 'react';
import { Button, Container, Paper, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';

// Get API URL based on environment
const API_URL = process.env.NODE_ENV === 'production' 
  ? process.env.NEXT_PUBLIC_API_URL 
  : 'http://localhost:5000';

// Add these constants at the top of the file
const MAX_WIDTH = 1600; // Maximum width for the scaled image
const MAX_HEIGHT = 1600; // Maximum height for the scaled image
const QUALITY = 0.8; // JPEG quality (0.8 is a good balance between size and quality)

// Add this function after the imports
const scaleImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            // Create a new file from the blob
            const scaledFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(scaledFile);
          },
          'image/jpeg',
          QUALITY
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      try {
        const originalFile = event.target.files[0];
        const scaledImage = await scaleImage(originalFile);
        setImage(scaledImage);
        setError(null);
      } catch (err) {
        setError('Error processing image');
        console.error(err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      setError('Please select an image first');
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', image);

    try {
      const response = await axios.post(`${API_URL}/api/process-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data);
    } catch (err) {
      setError('An error occurred while processing the image');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" className="py-8">
      <Typography variant="h4" component="h1" className="mb-8 text-center">
        English Helper
      </Typography>

      <Paper className="p-6">
        <Box className="space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="mb-4 w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 
  file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 
  hover:file:bg-blue-100 cursor-pointer"
          />

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Process Image'}
          </Button>

          {error && (
            <Typography color="error" className="mt-4">
              {error}
            </Typography>
          )}

          {result && (
            <Box className="mt-8 space-y-6">
              {/* Answers Section */}
              <section>
                <Typography variant="h6">Answers</Typography>
                <Typography>{result.complete_passage}</Typography>
              </section>

              {/* Translation Section */}
              <section>
                <Typography variant="h6">Vietnamese Translation</Typography>
                <Typography>{result.vietnamese_translation}</Typography>
              </section>

              {/* New Words Section */}
              <section>
                <Typography variant="h6">New Words</Typography>
                {result.new_words?.map((word: any, index: number) => (
                  <Box key={index} className="mt-2">
                    <Typography>
                      {word.word} ({word.part_of_speech}) - {word.meaning}
                    </Typography>
                  </Box>
                ))}
              </section>
            </Box>
          )}
        </Box>
      </Paper>
    </Container>
  );
} 