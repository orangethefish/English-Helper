'use client';

import { useState } from 'react';
import { Button, Container, Paper, Typography, Box, CircularProgress } from '@mui/material';
import axios from 'axios';

export default function Home() {
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
      setError(null);
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
      const response = await axios.post('http://localhost:5000/api/process-image', formData, {
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