const bonjour = require('bonjour')();

// Discover the "http" service
bonjour.find({ type: 'http' }, (service) => {
  console.log('Found a service:', service);

  // Print the name and hostname of the service
  console.log('Name:', service.name);
  console.log('Hostname:', service.host);
  console.log('Port:', service.port);
});