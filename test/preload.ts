// Disable SSL certificate verification for tests that make real HTTP requests.
// This works around UNABLE_TO_GET_ISSUER_CERT_LOCALLY errors in environments
// where the system certificate store is not properly configured.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
