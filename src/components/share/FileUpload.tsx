import { useState, ChangeEvent } from 'react';
import axios from 'axios';
import { Button, Progress } from 'antd';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk

const FileUpload = () => {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);

  // Handle file change
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Upload chunk function
  const uploadChunk = async (chunk: Blob, index: number, totalChunks: number, fileName: string) => {
    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', index.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('fileName', fileName);

    try {
      await axios.post('http://localhost:5000/upload-chunk', formData);
    } catch (error) {
      console.error('Error uploading chunk:', error);
      throw error;
    }
  };

  // Handle upload process
  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    const fileSize = file.size;
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    const fileName = file.name;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(fileSize, start + CHUNK_SIZE);

      const chunk = file.slice(start, end);
      await uploadChunk(chunk, i, totalChunks, fileName);

      // Update progress
      setProgress(Math.round(((i + 1) / totalChunks) * 100));
    }

    alert('File uploaded successfully!');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: 'auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Chunked File Upload</h1>
      <input type="file" onChange={handleFileChange} style={{ marginBottom: '20px' }} />
      <Button
        type="primary"
        onClick={handleUpload}
        disabled={!file}
        style={{ marginBottom: '20px' }}
        block
      >
        Upload
      </Button>

      {progress > 0 && (
        <Progress
          percent={progress}
          status={progress < 100 ? 'active' : 'success'}
          strokeColor={{
            '0%': '#108ee9',
            '100%': '#87d068',
          }}
        />
      )}
    </div>
  );
};

export default FileUpload;
