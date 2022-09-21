import ms from 'ms'

/**
 * @summary Convert a number or a string to milliseconds using ms package
 * @param {number | string} time the value to be converted
 * @returns {number }
 */
export const convertToMs = time => {
  if (typeof time === 'string') {
    return ms(time)
  }
  return time
}

/**
 * @summary function to calculate how much delay (in milliseconds) has been applied to the request
 * @param {number} requestCounter counter which indicates how many requests were made
 * @param {object} pluginOptions mandatory for calculating the delay based on options
 * @returns {number} calculated delay in milliseconds
 */
export const calculateDelay = (requestCounter, pluginOptions) => {
  if (
    pluginOptions.delayAfter === 0 ||
    pluginOptions.delay === 0 ||
    pluginOptions.timeWindow === 0 ||
    pluginOptions.maxDelay === 0 ||
    requestCounter <= pluginOptions.delayAfter
  ) {
    return 0
  }
  const maxDelayMs = convertToMs(pluginOptions.maxDelay)
  const delayMs = convertToMs(pluginOptions.delay)
  const remainingRequests = Math.max(
    requestCounter - pluginOptions.delayAfter,
    0
  )
  return Math.min(remainingRequests * delayMs, maxDelayMs)
}
