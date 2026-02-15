import fetch from 'node-fetch';

fetch('http://localhost:3000/api/timeline')
  .then(response => response.json())
  .then(data => {
    console.log('Raw Timeline API response:');
    console.log('Type:', typeof data);
    console.log('Length:', data?.length);
    console.log('Is array:', Array.isArray(data));
    if (data && data.length > 0) {
      console.log('First event keys:', Object.keys(data[0]));
      console.log('First event:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Data is empty or invalid:', data);
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
