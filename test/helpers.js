/**
 * @summary void function to hit the `endpointReached` for `delayAfter` times
 * @param {number} delayAfter how many times to execute the function `endpointReached`
 * @param {fn} endpointReached function that will return a request to an endpoint
 */
export const slowDownAPI = async (delayAfter, endpointReached) => {
  for (let i = 0; i < delayAfter; i++) {
    await endpointReached()
  }
}

/**
 * @summary internal method for fetching data from localhost
 * @param {number} port where is running the server on localhost
 * @param {*}  relative location to fetch the data
 */
export const internalFetch = (port, path, options) =>
  fetch('http://localhost:' + port + path, options)
