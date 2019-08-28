/**
 * config information messages list
 */
var messages = {
    'AUTH': {
      'TOKEN_INVALID': 'Access token is invalid',
      'TOKEN_EXPIRED': 'Access token is expired',
      'TOKEN_NOT_FOUND': 'Token not found',
      'USER_NOT_FOUND': 'User does not exist, please try again',
      'AUTH_INVALID': 'User name or password is not correct, please try again'
    },
    'USER': {
      'EMAIL_EXIST': 'Email is already exist in the system!',
      'USERNAME_EXIST': 'Username is already existed in the system!'
    },
    'ROLE_PERMISSION': {
      'ROLE_PUT_ERROR': 'Resource usage\'s report with action: '
       + '(Add, Edit, Delete) and (Add Own, Edit Own, Delete Own) have to the same.'
    },
    'ERROR_SERVER': 'Have an error in server, please try again',
    'COMMON': {
      'SUCCESSFULLY': 'Successfully.',
      'INVALID_PARAMETER': 'Query parameters are invalid.',
      'MISSING_DATA': 'Query parameters are missed',
      'NOT_FOUND': 'Data not found, please try again',
      'NO_PERMISSION': 'You need permission to perform this action!',
      'INVALID_DATA': 'Data input invalid',
      'CREATE_SUCCESS': 'Create data successfull',
      'UPDATE_SUCCESS': 'Update data successfull',
      'DELETE_SUCCESS': 'Delete data sucessfull',
      'GET_SUCCESS': 'Get data sucessfull',
      'NO_FILE_PASS': 'No file passed'
    }
  };
  module.exports = messages;