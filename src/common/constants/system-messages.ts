export const SYSTEM_MESSAGES = {
  // general messages
  INTERNAL_SERVER_ERROR:
    'An unexpected error occurred. Please try again later.',
  NOT_FOUND: 'The requested resource was not found.',
  UNAUTHORIZED: 'You are not authorized to access this resource.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  BAD_REQUEST: 'The request was invalid or cannot be served.',
  TOO_MANY_REQUESTS:
    'You have sent too many requests in a given amount of time. Please try again later.',
  SUCCESS: 'Operation completed successfully',
  FAILURE: 'Operation failed. Please try again.',
  UPDATE_SUCCESS: 'Resource updated successfully',
  DELETE_SUCCESS: 'Resource deleted successfully',
  CREATE_SUCCESS: 'Resource created successfully',

  // auth messages
  AUTH_LOGIN_SUCCESS: 'Login successful',
  AUTH_LOGOUT_SUCCESS: 'Logout successful',
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_RESET_SUCCESS: 'Password reset successful',
  AUTH_REGISTER_SUCCESS: 'Registration successful',
  AUTH_PASSWORD_MISMATCH: 'Passwords do not match',
  AUTH_TOKEN_MISSING: 'Authentication token is missing',
  AUTH_TOKEN_INVALID: 'Invalid or expired authentication token',
  AUTH_RESET_MAIL_SENT: 'Password reset email sent successfully',
  AUTH_USER_EXISTS: 'User with email already exists',
  AUTH_USERS_RETRIEVE_SUCCESS: 'Users retrieved successfully',
  AUTH_USER_RETRIEVE_SUCCESS: 'User retrieval successful',
  AUTH_NO_ROLE: 'Unathorized, role is missing or not allowed',

  //   url messages
  URL_CREATE_SUCCESS: 'Short URL created successfully',
  URL_RETRIEVE_SUCCESS: 'URL retrieved successfully',
  URL_NOT_FOUND: 'Short URL not found',
  URL_INVALID: 'Invalid URL provided',
  URL_DELETE_SUCCESS: 'Short URL deleted successfully',
  URL_UPDATE_SUCCESS: 'Short URL updated successfully',
  FAIL_TO_GENERATE_QR: 'Failed to generate QR code',
  QR_CREATE_SUCCESS: 'QR code created successfully',
};
