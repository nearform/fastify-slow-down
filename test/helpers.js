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
