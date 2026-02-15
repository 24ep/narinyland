const fetch = require('node-fetch');

fetch('http://localhost:3002/api/timeline')
  .then(response => response.json())
  .then(data => {
    console.log('Timeline API response:');
    console.log('Number of events:', data.length);
    if (data.length > 0) {
      console.log('First event:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('No events found!');
    }
  })
  .catch(error => {
    console.error('Error:', error.message);
  });
