import fetch from 'node-fetch';

fetch('http://localhost:3000/api/timeline-debug')
  .then(response => response.json())
  .then(data => {
    console.log('Timeline Debug API response:');
    console.log('Success:', data.success);
    console.log('Count:', data.count);
    if (data.success && data.data && data.data.length > 0) {
      console.log('First event:', JSON.stringify(data.data[0], null, 2));
    } else {
      console.log('No events found or error:', data);
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
